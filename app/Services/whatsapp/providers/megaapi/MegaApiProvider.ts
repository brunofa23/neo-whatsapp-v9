import Agent from 'App/Models/Agent'
import {
  IWhatsAppProvider,
  ProviderKind,
  WaAck,
  WaInboundMessage,
} from 'App/Services/whatsapp/core/IWhatsAppProvider'

/**
 * Provider baseado na MegaAPI.
 *
 * Importante:
 * - MegaAPI já mantém a sessão/instância lá na nuvem.
 * - Aqui a gente só:
 *    - dispara requests HTTP para enviar mensagem
 *    - (opcional) consulta status da instância
 *    - recebe webhooks em outro lugar e converte em WaInboundMessage + WaAck
 *
 * Esse provider foca em ENVIAR e em manter o contrato do IWhatsAppProvider.
 * A parte de entrada (webhook) normalmente é tratada em um controller separado
 * que chama this.onMessageCb / this.onAckCb.
 */
export default class MegaApiProvider implements IWhatsAppProvider {
  public kind: ProviderKind = 'megaapi'

  // Callbacks registrados pelo WhatsAppEngine
  private onMessageCb: (msg: WaInboundMessage) => Promise<void> = async () => {}
  private onAckCb: (ack: WaAck) => Promise<void> = async () => {}
  private onDisconnectedCb: (agentId: number, reason: string) => Promise<void> = async () => {}

  // Se você tiver múltiplas instâncias na MegaAPI, pode mapear agentId -> instance_key
  // aqui. Ex: pegar do Agent, config, etc.
  private getInstanceKeyForAgent(agentId: number): string {
    // TODO: buscar no banco ou no Agent (ex: agent.megaapiInstanceKey)
    // Por enquanto, só pra ilustrar:
    return `megastart-agent-${agentId}`
  }

  // Se quiser, você pode guardar "estado" em memória (opcional)
  private states = new Map<number, string>()

  public onMessage(cb: (msg: WaInboundMessage) => Promise<void>): void {
    this.onMessageCb = cb
  }

  public onAck(cb: (ack: WaAck) => Promise<void>): void {
    this.onAckCb = cb
  }

  public onDisconnected(cb: (agentId: number, reason: string) => Promise<void>): void {
    this.onDisconnectedCb = cb
  }

  /**
   * Start no contexto da MegaAPI normalmente NÃO significa abrir browser.
   * Pode significar:
   *  - criar uma instância se não existir
   *  - acionar "scan" para gerar QR (feito via endpoint MegaAPI)
   *  - atualizar status no Agent
   *
   * Aqui vamos deixar "light", apenas marcar estado e atualizar Agent.
   * A integração real de QR / status MegaAPI você pluga depois.
   */
  public async start(agentId: number): Promise<void> {
    console.log(`[MegaApiProvider] start(${agentId})`)

    const agent = await Agent.find(agentId)
    if (!agent) {
      throw new Error(`Agent não encontrado: ${agentId}`)
    }

    // TODO: aqui você poderia chamar MegaAPI para:
    //  - criar instância
    //  - pedir QR (e salvar base64 em agent.qrcode)
    //  - etc.

    this.states.set(agentId, 'INITIALIZING')

    agent.status = 'INITIALIZING_MEGAAPI'
    agent.statusconnected = false
    await agent.save()
  }

  /**
   * Stop na MegaAPI (opcional)
   * Pode ser:
   *  - deslogar instância
   *  - só marcar como desconectado localmente
   */
  public async stop(agentId: number): Promise<void> {
    console.log(`[MegaApiProvider] stop(${agentId})`)

    const agent = await Agent.find(agentId)

    // TODO: aqui você pode chamar MegaAPI para deslogar / encerrar instância

    this.states.set(agentId, 'DISCONNECTED')

    if (agent) {
      agent.status = 'DISCONNECTED_MEGAAPI'
      agent.statusconnected = false
      await agent.save()
    }

    await this.onDisconnectedCb(agentId, 'STOP_REQUESTED')
  }

  /**
   * Estado simples no contexto MegaAPI
   */
  public async getState(agentId: number): Promise<string> {
    // Aqui poderíamos consultar MegaAPI via HTTP para ver se a instância
    // está conectada, escaneando QR, etc.
    // Por enquanto, usa o cache local.
    return this.states.get(agentId) || 'UNKNOWN_MEGAAPI'
  }

  /**
   * Envia mensagem de texto via MegaAPI
   * Aqui você de fato integra com o endpoint de envio da MegaAPI.
   */
  public async sendText(agentId: number, to: string, text: string): Promise<any> {
    const agent = await Agent.find(agentId)
    if (!agent) {
      throw new Error(`Agent não encontrado: ${agentId}`)
    }

    const instanceKey = this.getInstanceKeyForAgent(agentId)
    console.log(
      `[MegaApiProvider] Enviando texto (agent=${agentId}, instance=${instanceKey}) para ${to}: ${text}`
    )

    // TODO: integrar aqui com MegaAPI.
    // Exemplo (pseudo-código, você ajusta depois com axios/fetch):
    //
    // const baseUrl = process.env.MEGAAPI_BASE_URL
    // const token = process.env.MEGAAPI_TOKEN
    //
    // const payload = {
    //   instance_key: instanceKey,
    //   to,              // idealmente no formato 5531xxxxx
    //   message: text,
    // }
    //
    // const result = await axios.post(
    //   `${baseUrl}/rest/sendText`,
    //   payload,
    //   { headers: { Authorization: `Bearer ${token}` } }
    // )
    //
    // return result.data

    // Por enquanto, só simula:
    return {
      provider: 'megaapi',
      agentId,
      to,
      text,
      status: 'SIMULATED_SENT',
    }
  }

  /**
   * Envia mídia via MegaAPI (arquivo do servidor)
   */
  public async sendMedia(
    agentId: number,
    to: string,
    filePath: string,
    caption?: string
  ): Promise<any> {
    const agent = await Agent.find(agentId)
    if (!agent) {
      throw new Error(`Agent não encontrado: ${agentId}`)
    }

    const instanceKey = this.getInstanceKeyForAgent(agentId)
    console.log(
      `[MegaApiProvider] Enviando mídia (agent=${agentId}, instance=${instanceKey}) para ${to}: file=${filePath}, caption=${caption}`
    )

    // TODO: integrar com o endpoint de envio de mídia da MegaAPI
    // Lembrando que pode precisar enviar como multipart/form-data.
    //
    // const baseUrl = process.env.MEGAAPI_BASE_URL
    // const token = process.env.MEGAAPI_TOKEN
    //
    // const formData = new FormData()
    // formData.append('instance_key', instanceKey)
    // formData.append('to', to)
    // formData.append('caption', caption || '')
    // formData.append('file', fs.createReadStream(filePath))
    //
    // const result = await axios.post(
    //   `${baseUrl}/rest/sendMedia`,
    //   formData,
    //   { headers: { Authorization: `Bearer ${token}`, ...formData.getHeaders() } }
    // )
    //
    // return result.data

    // Por enquanto, só simula:
    return {
      provider: 'megaapi',
      agentId,
      to,
      filePath,
      caption,
      status: 'SIMULATED_MEDIA_SENT',
    }
  }

  // ======================================================================
  // 🔹 PONTO IMPORTANTE: entrada de mensagens (webhook)
  // ======================================================================
  //
  // A MegaAPI irá chamar SUA API (um endpoint HTTP) com os dados da mensagem.
  // Nesse endpoint, você precisará pegar esse JSON e converter para WaInboundMessage
  // e depois chamar this.onMessageCb(inbound).
  //
  // Algo assim (em um controller próprio, só exemplo):
  //
  //   const inbound: WaInboundMessage = {
  //     provider: 'megaapi',
  //     agentId,
  //     from: body.from,
  //     to: body.to,
  //     body: body.message,
  //     hasMedia: body.hasMedia,
  //     messageId: body.id,
  //     timestamp: body.timestamp,
  //     raw: body,
  //   }
  //
  //   await megaApiProviderInstance.handleInbound(inbound)
  //
  // Para encaixar isso, você pode expor um método público abaixo:
  // ======================================================================

  /**
   * Método auxiliar para ser chamado pelo controller de webhook da MegaAPI,
   * convertendo o evento em WaInboundMessage.
   */
  public async handleInboundFromWebhook(agentId: number, payload: any): Promise<void> {
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

    await this.onMessageCb(inbound)
  }

  /**
   * Auxiliar para ACK vindo do webhook MegaAPI (se ela enviar infos de entrega).
   */
  public async handleAckFromWebhook(agentId: number, payload: any): Promise<void> {
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

    await this.onAckCb(ack)
  }
}
