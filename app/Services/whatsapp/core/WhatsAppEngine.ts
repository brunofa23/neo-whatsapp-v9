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
   * Agora temos um provider POR AGENTE.
   * Ex:
   *   - agent 505 → WWebJSProvider
   *   - agent 601 → MegaApiProvider
   */
  private providers = new Map<number, IWhatsAppProvider>()

  private router: MessageRouter

  constructor() {
    this.router = new MessageRouter()
    // Os callbacks são registrados por provider na hora do resolveProvider(...)
  }

  /**
   * Descobre o tipo de provider configurado no Agent:
   *  - providerType
   *  - ou provider_type
   *  - default: 'wwebjs'
   */
  private resolveProviderTypeFromAgent(agent: Agent): 'wwebjs' | 'megaapi' {
    const type =
      (agent as any).providerType ||
      (agent as any).provider_type ||
      'wwebjs'

    if (type === 'megaapi') return 'megaapi'
    return 'wwebjs'
  }

  /**
   * Cria (ou retorna) o provider para um agent específico.
   * - Lê o Agent do banco
   * - Decide provider ('wwebjs' ou 'megaapi')
   * - Instancia o provider
   * - Registra callbacks (onMessage / onAck / onDisconnected)
   * - Armazena no Map
   */
  private async getOrCreateProvider(agentId: number): Promise<IWhatsAppProvider> {
    const existing = this.providers.get(agentId)
    if (existing) {
      return existing
    }

    const agent = await Agent.findOrFail(agentId)
    const providerType = this.resolveProviderTypeFromAgent(agent)

    let provider: IWhatsAppProvider

    if (providerType === 'megaapi') {
      provider = new MegaApiProvider()
    } else {
      provider = new WWebJSProvider()
    }

    // Registra os callbacks do Engine nesse provider
    provider.onMessage(this.handleInboundMessage)
    provider.onAck(this.handleAck)
    provider.onDisconnected(this.handleDisconnected)

    this.providers.set(agentId, provider)

    return provider
  }

  /**
   * Opcional: devolve o providerKind para um agent específico
   */
  public async getProviderKind(agentId: number): Promise<string> {
    const provider = await this.getOrCreateProvider(agentId)
    return provider.kind
  }

  /**
   * Start do agent: chama o provider correspondente
   */
  public async startAgent(agentId: number): Promise<void> {
    const provider = await this.getOrCreateProvider(agentId)
    console.log(
      '[WhatsAppEngine] startAgent(' +
        agentId +
        ') usando provider: ' +
        provider.kind
    )
    await provider.start(agentId)
  }

  /**
   * Stop do agent: chama o provider correspondente e limpa do Map
   */
  public async stopAgent(agentId: number): Promise<void> {
    const provider = await this.getOrCreateProvider(agentId)
    await provider.stop(agentId)
    this.providers.delete(agentId)
  }

  /**
   * Estado do agent (conectado, etc.)
   */
  public async getState(agentId: number): Promise<string> {
    const provider = await this.getOrCreateProvider(agentId)
    return provider.getState(agentId)
  }

  /**
   * Envio de texto via provider correto
   */
  public async sendText(agentId: number, to: string, text: string) {
    const provider = await this.getOrCreateProvider(agentId)
    return provider.sendText(agentId, to, text)
  }

  /**
   * Envio de mídia via provider correto
   */
  public async sendMedia(agentId: number, to: string, filePath: string, caption?: string) {
    const provider = await this.getOrCreateProvider(agentId)
    return provider.sendMedia(agentId, to, filePath, caption)
  }

  /**
   * Callback chamado pelos providers quando chega mensagem
   */
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

  /**
   * Callback de ACK vindo dos providers
   */
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

  /**
   * Callback quando algum provider avisa que desconectou
   */
  private handleDisconnected = async (agentId: number, reason: string) => {
    console.log('[WhatsAppEngine] Agent desconectado:', { agentId, reason })
    // Opcional: poderia atualizar algo no banco aqui também, se quiser centralizar
  }
}

const whatsAppEngine = new WhatsAppEngine()
export default whatsAppEngine
