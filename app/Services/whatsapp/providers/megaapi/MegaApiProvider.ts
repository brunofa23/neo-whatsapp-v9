// app/Services/whatsapp/providers/megaapi/MegaApiProvider.ts

import axios from 'axios'
import Agent from 'App/Models/Agent'
import {
  IWhatsAppProvider,
  ProviderKind,
  WaInboundMessage,
  WaAck,
} from 'App/Services/whatsapp/core/IWhatsAppProvider'

interface MegaApiConfig {
  baseUrl: string // ex: https://apistart01.megaapi.com.br
  instanceKey: string
  token: string
}

/**
 * Provider para MegaAPI.
 *
 * Nesta versão ele faz:
 * - start(agentId): valida se a instância responde
 * - stop(agentId): chama logout da instância
 * - getState(agentId): consulta /instance/{instance_key}
 * - sendText(agentId, to, text): envia texto via /sendMessage/{instance_key}/text
 *
 * FUTURO:
 * - integrar webhook MegaAPI -> this.messageCb / this.ackCb
 */
export default class MegaApiProvider implements IWhatsAppProvider {
  public kind: ProviderKind = 'megaapi'

  // Callbacks registrados pelo engine
  private messageCb?: (msg: WaInboundMessage) => Promise<void>
  private ackCb?: (ack: WaAck) => Promise<void>
  private disconnectedCb?: (agentId: number, reason: string) => Promise<void>

  // =========================================================
  // Utils
  // =========================================================

  /**
   * Carrega a configuração MegaAPI para este agent a partir do próprio Agent.
   * Usa os campos snake_case: megaapi_host, megaapi_instance_key, megaapi_token.
   */
  private async getConfig(agentId: number): Promise<MegaApiConfig> {
    const agent = await Agent.findOrFail(agentId)

    if (agent.provider_type !== 'megaapi') {
      throw new Error(
        `MegaApiProvider: agent ${agentId} não está configurado como provider_type = 'megaapi'`
      )
    }

    const host = agent.megaapi_host
    const instanceKey = agent.megaapi_instance_key
    const token = agent.megaapi_token

    if (!host || !instanceKey || !token) {
      throw new Error(
        `MegaApiProvider: campos megaapi_host, megaapi_instance_key ou megaapi_token não configurados para agent ${agentId}`
      )
    }

    return {
      baseUrl: `https://${host}/rest`,
      instanceKey,
      token,
    }
  }

  /**
   * Header padrão com Bearer Token da MegaAPI
   */
  private getAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  /**
   * Atualiza o Agent no banco conforme o estado detectado no provider.
   * - CONNECTED     => statusconnected=true, status='CONNECTED', qrcode=null
   * - DISCONNECTED  => statusconnected=false, status='DISCONNECTED'
   * - ERROR         => statusconnected=false, status='ERROR'
   */
  private async syncAgentConnection(agentId: number, status: string): Promise<void> {
    const agent = await Agent.find(agentId)
    if (!agent) return

    const connected = status === 'CONNECTED'

    // evita writes desnecessários
    const changed =
      agent.statusconnected !== connected ||
      agent.status !== status ||
      (connected && agent.qrcode !== null)

    if (!changed) return

    agent.statusconnected = connected
    agent.status = status

    if (connected) {
      agent.qrcode = null
    }

    await agent.save()
  }

  /**
   * Decide o status a partir do payload do endpoint /instance/{instance_key}
   */
  private computeStatusFromInstancePayload(respData: any): 'CONNECTED' | 'DISCONNECTED' {
    const instance = respData?.instance || {}
    const hasUser = instance.user || instance.id
    return hasUser ? 'CONNECTED' : 'DISCONNECTED'
  }

  /**
   * Converte o "to" vindo do engine para o formato aceito pela MegaAPI:
   *
   * - Contatos privados: 551199999999@s.whatsapp.net
   * - Grupos: já vem como ...@g.us (não mexemos)
   *
   * Entradas possíveis:
   * - "551199999999"
   * - "551199999999@c.us"
   * - "551199999999@s.whatsapp.net"
   * - "551199999999@g.us"
   */
  private normalizeToJid(to: string): string {
    const lower = (to || '').toLowerCase().trim()

    // já está em formato aceito pela API
    if (lower.endsWith('@s.whatsapp.net') || lower.endsWith('@g.us')) {
      return lower
    }

    // formato do whatsapp-web.js
    if (lower.endsWith('@c.us')) {
      const digits = lower.replace(/\D/g, '')
      return `${digits}@s.whatsapp.net`
    }

    // apenas dígitos
    const digits = lower.replace(/\D/g, '')
    if (!digits) {
      throw new Error(`MegaApiProvider.normalizeToJid: número inválido: "${to}"`)
    }

    return `${digits}@s.whatsapp.net`
  }

  // =========================================================
  // Implementação da interface IWhatsAppProvider
  // =========================================================

  public onMessage(cb: (msg: WaInboundMessage) => Promise<void>): void {
    this.messageCb = cb
  }

  public onAck(cb: (ack: WaAck) => Promise<void>): void {
    this.ackCb = cb
  }

  public onDisconnected(cb: (agentId: number, reason: string) => Promise<void>): void {
    this.disconnectedCb = cb
  }

  /**
   * Start:
   * Na MegaAPI a sessão já roda lá, então aqui apenas validamos se a instância responde.
   * GET /rest/instance/{instance_key}
   */
  public async start(agentId: number): Promise<void> {
    const cfg = await this.getConfig(agentId)

    try {
      const url = `${cfg.baseUrl}/instance/${cfg.instanceKey}`
      const resp = await axios.get(url, {
        headers: this.getAuthHeaders(cfg.token),
      })

      console.log(
        `[MegaApiProvider][${agentId}] start(): instancia ok, message:`,
        resp.data?.message
      )

      // ✅ sincroniza status no Agent conforme resposta
      const status = this.computeStatusFromInstancePayload(resp.data)
      await this.syncAgentConnection(agentId, status)
    } catch (error: any) {
      console.error(
        `[MegaApiProvider][${agentId}] Erro ao iniciar MegaAPI:`,
        error?.response?.data || error?.message || error
      )

      // ✅ marca erro no Agent (não conectado)
      await this.syncAgentConnection(agentId, 'ERROR')

      throw new Error('Falha ao iniciar MegaAPI para este agent')
    }
  }

  /**
   * Stop:
   * Desloga a instância na MegaAPI.
   * DELETE /rest/instance/{instance_key}/logout
   */
  public async stop(agentId: number): Promise<void> {
    const cfg = await this.getConfig(agentId)

    try {
      const url = `${cfg.baseUrl}/instance/${cfg.instanceKey}/logout`
      const resp = await axios.delete(url, {
        headers: this.getAuthHeaders(cfg.token),
      })

      console.log(
        `[MegaApiProvider][${agentId}] stop():`,
        resp.data?.message || 'Logout solicitado'
      )

      // ✅ marca desconectado
      await this.syncAgentConnection(agentId, 'DISCONNECTED')

      if (this.disconnectedCb) {
        await this.disconnectedCb(agentId, 'logout')
      }
    } catch (error: any) {
      console.error(
        `[MegaApiProvider][${agentId}] Erro ao parar MegaAPI:`,
        error?.response?.data || error?.message || error
      )

      // ✅ não quebra fluxo, mas marca erro
      await this.syncAgentConnection(agentId, 'ERROR')
      // não relançamos para não quebrar fluxo
    }
  }

  /**
   * Estado da instância:
   * GET /rest/instance/{instance_key}
   * Se houver "user" ou "id" consideramos CONNECTED, senão DISCONNECTED.
   */
  public async getState(agentId: number): Promise<string> {
    const cfg = await this.getConfig(agentId)

    try {
      const url = `${cfg.baseUrl}/instance/${cfg.instanceKey}`
      const resp = await axios.get(url, {
        headers: this.getAuthHeaders(cfg.token),
      })

      const status = this.computeStatusFromInstancePayload(resp.data)
      console.log(`[MegaApiProvider][${agentId}] getState():`, status)

      // ✅ sincroniza status no Agent
      await this.syncAgentConnection(agentId, status)

      return status
    } catch (error: any) {
      console.error(
        `[MegaApiProvider][${agentId}] Erro em getState MegaAPI:`,
        error?.response?.data || error?.message || error
      )

      await this.syncAgentConnection(agentId, 'ERROR')
      return 'ERROR'
    }
  }

  /**
   * Envia texto:
   * POST /rest/sendMessage/{instance_key}/text
   * Body:
   * {
   *   "messageData": {
   *     "to": "551199999999@s.whatsapp.net",
   *     "text": "Mensagem..."
   *   }
   * }
   */
  public async sendText(agentId: number, to: string, text: string): Promise<any> {
    const cfg = await this.getConfig(agentId)

    try {
      const jid = this.normalizeToJid(to)
      const url = `${cfg.baseUrl}/sendMessage/${cfg.instanceKey}/text`

      const body = {
        messageData: {
          to: jid,
          text,
        },
      }

      const resp = await axios.post(url, body, {
        headers: this.getAuthHeaders(cfg.token),
      })

      const data = resp.data
      console.log(`[MegaApiProvider][${agentId}] sendText OK ->`, {
        to: jid,
        error: data?.error,
        message: data?.message,
        id: data?.id,
      })

      // ✅ opcional: se conseguiu enviar, podemos marcar como conectado
      // (desde que a API esteja de fato online)
      await this.syncAgentConnection(agentId, 'CONNECTED')

      return data
    } catch (error: any) {
      console.error(
        `[MegaApiProvider][${agentId}] Erro em sendText MegaAPI:`,
        error?.response?.data || error?.message || error
      )

      // ✅ marca erro no Agent (não conectado)
      await this.syncAgentConnection(agentId, 'ERROR')

      throw new Error('MegaApiProvider: erro ao enviar mensagem de texto')
    }
  }

  /**
   * Envio de mídia:
   * Ainda não implementado.
   * Provavelmente vamos usar:
   *  - fileFromUrl (subir o arquivo em uma URL pública)
   *  - ou fileFromBase64
   */
  public async sendMedia(
    agentId: number,
    to: string,
    filePath: string,
    caption?: string
  ): Promise<any> {
    console.warn(
      `[MegaApiProvider][${agentId}] sendMedia ainda não implementado. filePath: ${filePath}, caption: ${caption}`
    )
    throw new Error(
      'MegaApiProvider.sendMedia ainda não implementado (usar URL ou base64 futuramente)'
    )
  }

  // =========================================================
  // Métodos auxiliares para webhook (usar depois)
  // =========================================================

  /**
   * Para ser chamado pelo controller de webhook da MegaAPI
   * quando chegar uma mensagem.
   */
  public async handleInboundFromWebhook(agentId: number, payload: any): Promise<void> {
    if (!this.messageCb) return

    const inbound: WaInboundMessage = {
      provider: this.kind,
      agentId,
      from: payload.from,
      to: payload.to,
      body: payload.message || '',
      hasMedia: !!payload.hasMedia,
      messageId: payload.id || `${payload.from}-${Date.now()}`,
      timestamp: payload.timestamp || Date.now(),
      raw: payload,
    }

    console.log('[MegaApiProvider] Mensagem recebida via webhook MegaAPI:', {
      agentId,
      from: inbound.from,
      to: inbound.to,
      body: inbound.body,
      hasMedia: inbound.hasMedia,
      messageId: inbound.messageId,
    })

    await this.messageCb(inbound)
  }

  /**
   * Para ser chamado pelo webhook MegaAPI quando houver atualizações de ACK / status.
   */
  public async handleAckFromWebhook(agentId: number, payload: any): Promise<void> {
    if (!this.ackCb) return

    const ack: WaAck = {
      provider: this.kind,
      agentId,
      from: payload.from,
      to: payload.to,
      messageId: payload.id,
      ack: payload.ack ?? 0,
      timestamp: payload.timestamp || Date.now(),
    }

    console.log('[MegaApiProvider] ACK recebido via webhook MegaAPI:', {
      agentId,
      from: ack.from,
      to: ack.to,
      messageId: ack.messageId,
      ack: ack.ack,
    })

    await this.ackCb(ack)
  }
}
