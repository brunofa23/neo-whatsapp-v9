import Agent from 'App/Models/Agent'
import {
  IWhatsAppProvider,
  WaInboundMessage,
  WaAck,
} from './IWhatsAppProvider'
import WWebJSProvider from 'App/Services/whatsapp/providers/wwebjs/WWebJSProvider'
import MegaApiProvider from 'App/Services/whatsapp/providers/megaapi/MegaApiProvider'
import MessageRouter from './MessageRouter'

class WhatsAppEngine {
  /**
   * Um provider POR agente:
   *  - agent 505 -> WWebJSProvider
   *  - agent 600 -> MegaApiProvider
   */
  private providers = new Map<number, IWhatsAppProvider>()

  private router: MessageRouter

  constructor() {
    this.router = new MessageRouter()
  }

  /**
   * Lê o tipo de provider configurado no Agent (snake_case):
   *  - provider_type = 'wwebjs' (default)
   *  - provider_type = 'megaapi'
   */
  private resolveprovider_typeFromAgent(agent: Agent): 'wwebjs' | 'megaapi' {
    const type = (agent.provider_type || 'wwebjs') as 'wwebjs' | 'megaapi'
    return type === 'megaapi' ? 'megaapi' : 'wwebjs'
  }

  /**
   * Devolve (ou cria) o provider para um agentId específico.
   * Se o provider já existe mas é de tipo diferente, faz swap.
   */
  private async getOrCreateProvider(agentId: number): Promise<IWhatsAppProvider> {
    const agent = await Agent.findOrFail(agentId)

    const provider_type = this.resolveprovider_typeFromAgent(agent)
    const desiredKind = provider_type === 'megaapi' ? 'megaapi' : 'wwebjs'

    console.log(
      `[WhatsAppEngine] getOrCreateProvider agentId=${agentId} provider_type=${agent.provider_type} desiredKind=${desiredKind}`
    )

    const existing = this.providers.get(agentId)

    if (existing) {
      if (existing.kind === desiredKind) {
        console.log(
          `[WhatsAppEngine] Reutilizando provider existente para agent ${agentId}: ${existing.kind}`
        )
        return existing
      }

      console.log(
        `[WhatsAppEngine] Trocando provider do agent ${agentId}: ${existing.kind} -> ${desiredKind}`
      )
      try {
        await existing.stop(agentId)
      } catch (e) {
        console.error(
          `[WhatsAppEngine] Erro ao parar provider antigo do agent ${agentId}:`,
          e
        )
      }
      this.providers.delete(agentId)
    }

    let provider: IWhatsAppProvider
    if (provider_type === 'megaapi') {
      console.log(`[WhatsAppEngine] Criando MegaApiProvider para agent ${agentId}`)
      provider = new MegaApiProvider()
    } else {
      console.log(`[WhatsAppEngine] Criando WWebJSProvider para agent ${agentId}`)
      provider = new WWebJSProvider()
    }

    provider.onMessage(this.handleInboundMessage)
    provider.onAck(this.handleAck)
    provider.onDisconnected(this.handleDisconnected)

    this.providers.set(agentId, provider)

    return provider
  }

  // =========================================================
  // Métodos públicos usados pelos controllers
  // =========================================================

  public async getProviderKind(agentId: number): Promise<string> {
    const provider = await this.getOrCreateProvider(agentId)
    return provider.kind
  }

  public async startAgent(agentId: number): Promise<void> {
    const provider = await this.getOrCreateProvider(agentId)
    console.log(
      `[WhatsAppEngine] startAgent(${agentId}) usando provider: ${provider.kind}`
    )
    await provider.start(agentId)
  }

  public async stopAgent(agentId: number): Promise<void> {
    const provider = await this.getOrCreateProvider(agentId)
    await provider.stop(agentId)
    this.providers.delete(agentId)
  }

  public async getState(agentId: number): Promise<string> {
    const provider = await this.getOrCreateProvider(agentId)
    return provider.getState(agentId)
  }

  public async sendText(agentId: number, to: string, text: string) {
    const provider = await this.getOrCreateProvider(agentId)
    console.log(
      `[WhatsAppEngine] sendText: agentId=${agentId}, provider=${provider.kind}, to=${to}`
    )
    return provider.sendText(agentId, to, text)
  }

  public async sendMedia(agentId: number, to: string, filePath: string, caption?: string) {
    const provider = await this.getOrCreateProvider(agentId)
    console.log(
      `[WhatsAppEngine] sendMedia: agentId=${agentId}, provider=${provider.kind}, to=${to}, filePath=${filePath}`
    )
    return provider.sendMedia(agentId, to, filePath, caption)
  }

  // =========================================================
  // Callbacks chamados pelos providers
  // =========================================================

  private handleInboundMessage = async (msg: WaInboundMessage) => {
    console.log('[WhatsAppEngine] Mensagem recebida (router):', {
      provider: msg.provider,
      agentId: msg.agentId,
      from: msg.from,
      to: msg.to,
      body: msg.body,
      hasMedia: msg.hasMedia,
      messageId: msg.messageId,
    })

    await this.router.handleInbound(msg)
  }

  private handleAck = async (ack: WaAck) => {
    console.log('[WhatsAppEngine] ACK recebido:', {
      provider: ack.provider,
      agentId: ack.agentId,
      from: ack.from,
      to: ack.to,
      messageId: ack.messageId,
      ack: ack.ack,
    })
  }

  private handleDisconnected = async (agentId: number, reason: string) => {
    console.log('[WhatsAppEngine] Agent desconectado:', { agentId, reason })
  }
}

const whatsAppEngine = new WhatsAppEngine()
export default whatsAppEngine
