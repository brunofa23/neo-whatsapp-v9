import axios from 'axios'
import Agent from 'App/Models/Agent'
import {
  IWhatsAppProvider,
  ProviderKind,
  WaInboundMessage,
  WaAck,
} from 'App/Services/whatsapp/core/IWhatsAppProvider'

interface MegaApiConfig {
  baseUrl: string
  instanceKey: string
  token: string
}

export default class MegaApiProvider implements IWhatsAppProvider {
  public kind: ProviderKind = 'megaapi'

  private messageCb?: (msg: WaInboundMessage) => Promise<void>
  private ackCb?: (ack: WaAck) => Promise<void>
  private disconnectedCb?: (agentId: number, reason: string) => Promise<void>

  // =========================================================
  // Utils
  // =========================================================
  private onlyDigits(v: any): string {
    return String(v ?? '').replace(/\D/g, '')
  }

  /** converte:
   *  - 5511...@s.whatsapp.net => 5511...@c.us
   *  - 5511...@c.us => 5511...@c.us
   *  - "5511..." => 5511...@c.us
   */
  private toCusJid(jid: string | null | undefined): string | null {
    if (!jid) return null
    const v = String(jid).trim().toLowerCase()

    if (v.endsWith('@c.us') || v.endsWith('@g.us') || v.endsWith('@broadcast') || v.endsWith('@lid')) {
      return v
    }

    if (v.endsWith('@s.whatsapp.net')) {
      const digits = this.onlyDigits(v)
      return digits ? `${digits}@c.us` : null
    }

    const digits = this.onlyDigits(v)
    return digits ? `${digits}@c.us` : null
  }

  private normalizeToJid(to: string): string {
    const lower = (to || '').toLowerCase().trim()

    if (lower.endsWith('@s.whatsapp.net') || lower.endsWith('@g.us')) return lower

    if (lower.endsWith('@c.us')) {
      const digits = this.onlyDigits(lower)
      return `${digits}@s.whatsapp.net`
    }

    const digits = this.onlyDigits(lower)
    if (!digits) throw new Error(`MegaApiProvider.normalizeToJid: número inválido: "${to}"`)
    return `${digits}@s.whatsapp.net`
  }

  private getAuthHeaders(token: string) {
    return { Authorization: `Bearer ${token}` }
  }

  private async getConfig(agentId: number): Promise<MegaApiConfig> {
    const agent = await Agent.findOrFail(agentId)

    if (agent.provider_type !== 'megaapi') {
      throw new Error(`MegaApiProvider: agent ${agentId} não é provider_type='megaapi'`)
    }

    const host = agent.megaapi_host
    const instanceKey = agent.megaapi_instance_key
    const token = agent.megaapi_token

    if (!host || !instanceKey || !token) {
      throw new Error(`MegaApiProvider: megaapi_host/instance_key/token ausentes no agent ${agentId}`)
    }

    return { baseUrl: `https://${host}/rest`, instanceKey, token }
  }

  private computeStatusFromInstancePayload(respData: any): 'CONNECTED' | 'DISCONNECTED' {
    const instance = respData?.instance || {}
    const hasUser = instance.user || instance.id
    return hasUser ? 'CONNECTED' : 'DISCONNECTED'
  }

  private async syncAgentConnection(agentId: number, status: string): Promise<void> {
    const agent = await Agent.find(agentId)
    if (!agent) return

    const connected = status === 'CONNECTED'
    const changed =
      agent.statusconnected !== connected ||
      agent.status !== status ||
      (connected && agent.qrcode !== null)

    if (!changed) return

    agent.statusconnected = connected
    agent.status = status
    if (connected) agent.qrcode = null
    await agent.save()
  }

  private extractBodyFromWebhook(payload: any): string {
    const msg = payload?.message || {}
    const type = String(payload?.messageType || '').trim()

    // conversation
    if (typeof msg.conversation === 'string') return msg.conversation

    // extendedTextMessage
    if (typeof msg?.extendedTextMessage?.text === 'string') return msg.extendedTextMessage.text

    // ephemeralMessage -> message -> extendedTextMessage/conversation
    if (type === 'ephemeralMessage') {
      const inner = msg?.ephemeralMessage?.message || {}
      if (typeof inner.conversation === 'string') return inner.conversation
      if (typeof inner?.extendedTextMessage?.text === 'string') return inner.extendedTextMessage.text
    }

    // fallback (caso você mapeie outro formato depois)
    if (typeof payload?.text === 'string') return payload.text
    if (typeof payload?.messageText === 'string') return payload.messageText
    if (typeof payload?.message === 'string') return payload.message

    return ''
  }

  private detectHasMedia(payload: any): boolean {
    if (!!payload?.hasMedia) return true
    const msg = payload?.message || {}
    const mediaKeys = [
      'audioMessage',
      'imageMessage',
      'videoMessage',
      'documentMessage',
      'stickerMessage',
      'ptvMessage',
      'contactMessage',
      'locationMessage',
    ]
    return mediaKeys.some((k) => !!msg?.[k])
  }

  private normalizeTimestamp(payload: any): number {
    const ts = Number(payload?.messageTimestamp ?? payload?.timestamp ?? Date.now())
    return ts < 1e12 ? ts * 1000 : ts
  }

  // =========================================================
  // Interface
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

  public async start(agentId: number): Promise<void> {
    const cfg = await this.getConfig(agentId)
    try {
      const url = `${cfg.baseUrl}/instance/${cfg.instanceKey}`
      const resp = await axios.get(url, { headers: this.getAuthHeaders(cfg.token) })
      const status = this.computeStatusFromInstancePayload(resp.data)
      await this.syncAgentConnection(agentId, status)
    } catch (error: any) {
      await this.syncAgentConnection(agentId, 'ERROR')
      throw new Error('Falha ao iniciar MegaAPI para este agent')
    }
  }

  public async stop(agentId: number): Promise<void> {
    const cfg = await this.getConfig(agentId)
    try {
      const url = `${cfg.baseUrl}/instance/${cfg.instanceKey}/logout`
      await axios.delete(url, { headers: this.getAuthHeaders(cfg.token) })
      await this.syncAgentConnection(agentId, 'DISCONNECTED')
      if (this.disconnectedCb) await this.disconnectedCb(agentId, 'logout')
    } catch {
      await this.syncAgentConnection(agentId, 'ERROR')
    }
  }

  public async getState(agentId: number): Promise<string> {
    const cfg = await this.getConfig(agentId)
    try {
      const url = `${cfg.baseUrl}/instance/${cfg.instanceKey}`
      const resp = await axios.get(url, { headers: this.getAuthHeaders(cfg.token) })
      const status = this.computeStatusFromInstancePayload(resp.data)
      await this.syncAgentConnection(agentId, status)
      return status
    } catch {
      await this.syncAgentConnection(agentId, 'ERROR')
      return 'ERROR'
    }
  }

  public async sendText(agentId: number, to: string, text: string): Promise<any> {
    const cfg = await this.getConfig(agentId)
    const jid = this.normalizeToJid(to)
    const url = `${cfg.baseUrl}/sendMessage/${cfg.instanceKey}/text`

    const body = { messageData: { to: jid, text } }
    const resp = await axios.post(url, body, { headers: this.getAuthHeaders(cfg.token) })
    await this.syncAgentConnection(agentId, 'CONNECTED')
    return resp.data
  }

  public async sendMedia(): Promise<any> {
    throw new Error('MegaApiProvider.sendMedia ainda não implementado')
  }

  // =========================================================
  // WEBHOOK -> ENGINE
  // =========================================================
  public async handleInboundFromWebhook(agentId: number, payload: any): Promise<void> {
    if (!this.messageCb) return

    // conforme exemplos oficiais:
    // - payload.key.remoteJid é o chat (contato ou grupo)
    // - payload.jid é o número da instância (seu WA)
    // :contentReference[oaicite:1]{index=1}
    const remoteJid = payload?.key?.remoteJid || payload?.from || ''
    const myJid = payload?.jid || payload?.to || ''

    const isGroup = String(remoteJid).toLowerCase().endsWith('@g.us')
    const participant = payload?.key?.participant || payload?.participant || null

    const body = this.extractBodyFromWebhook(payload)
    const hasMedia = this.detectHasMedia(payload)
    const messageId = payload?.key?.id || payload?.id || `${remoteJid}-${Date.now()}`
    const timestamp = this.normalizeTimestamp(payload)

    const fromDigits = isGroup
      ? this.onlyDigits(participant)
      : this.onlyDigits(remoteJid)

    const inbound: WaInboundMessage = {
      provider: this.kind,
      agentId,

      from: String(remoteJid),
      to: this.toCusJid(myJid) || String(myJid),

      body,
      hasMedia,

      messageId,
      timestamp,

      raw: payload,

      isGroup,
      author: isGroup ? String(participant || '') : null,

      // ✅ para o seu DB (que salva 5531...@c.us)
      fromPhoneJid: isGroup ? null : this.toCusJid(remoteJid),
      fromDigits,
      authorDigits: isGroup ? this.onlyDigits(participant) : '',
    }

    await this.messageCb(inbound)
  }

  public async handleAckFromWebhook(agentId: number, payload: any): Promise<void> {
    if (!this.ackCb) return

    const remoteJid = payload?.key?.remoteJid || payload?.from || ''
    const myJid = payload?.jid || payload?.to || ''

    const ack: WaAck = {
      provider: this.kind,
      agentId,
      from: String(remoteJid),
      to: this.toCusJid(myJid) || String(myJid),
      messageId: payload?.key?.id || payload?.id || '',
      ack: Number(payload?.ack ?? payload?.status ?? 0),
      timestamp: this.normalizeTimestamp(payload),
    }

    await this.ackCb(ack)
  }
}
