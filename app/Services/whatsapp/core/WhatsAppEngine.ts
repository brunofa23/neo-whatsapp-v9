import Agent from 'App/Models/Agent'
import MessageRouter from './MessageRouter'
import {
  IWhatsAppProvider,
  WaAck,
  WaInboundMessage,
} from './IWhatsAppProvider'

import WWebJSProvider from 'App/Services/whatsapp/providers/wwebjs/WWebJSProvider'
import MegaApiProvider from 'App/Services/whatsapp/providers/megaapi/MegaApiProvider'

type ProviderKind = 'wwebjs' | 'megaapi'

class WhatsAppEngine {
  // um router único para todo mundo
  private router: MessageRouter

  // um provider por tipo (wwebjs, megaapi). Cada provider pode atender vários agents.
  private providersByKind = new Map<ProviderKind, IWhatsAppProvider>()

  constructor() {
    this.router = new MessageRouter()
  }

  // --------------------------------------------------
  // Helpers internos
  // --------------------------------------------------
  private resolveProviderTypeFromAgent(agent: Agent): ProviderKind {
    const raw = (agent.provider_type || 'wwebjs') as ProviderKind
    return raw === 'megaapi' ? 'megaapi' : 'wwebjs'
  }

  private async getOrCreateProvider(agentId: number): Promise<IWhatsAppProvider> {
    const agent = await Agent.findOrFail(agentId)

    const providerType = this.resolveProviderTypeFromAgent(agent)
    let provider = this.providersByKind.get(providerType)

    if (!provider) {
      if (providerType === 'wwebjs') {
        provider = new WWebJSProvider()
      } else {
        provider = new MegaApiProvider()
      }

      // registra callbacks
      provider.onMessage(this.handleInboundMessage)
      provider.onAck(this.handleAck)
      provider.onDisconnected(this.handleDisconnected)

      this.providersByKind.set(providerType, provider)

      console.log(
        `[WhatsAppEngine] Criado provider ${providerType} para atender agents com provider_type=${providerType}`
      )
    }

    return provider
  }

  // --------------------------------------------------
  // Métodos públicos
  // --------------------------------------------------
  public async getProviderKind(agentId: number): Promise<ProviderKind> {
    const agent = await Agent.findOrFail(agentId)
    return this.resolveProviderTypeFromAgent(agent)
  }

  public async startAgent(agentId: number): Promise<void> {
    const provider = await this.getOrCreateProvider(agentId)
    const kind = await this.getProviderKind(agentId)

    console.log(
      `[WhatsAppEngine] startAgent(${agentId}) usando provider: ${kind}`
    )

    await provider.start(agentId)
  }

  public async stopAgent(agentId: number): Promise<void> {
    const provider = await this.getOrCreateProvider(agentId)
    await provider.stop(agentId)
  }

  public async getState(agentId: number): Promise<string> {
    const provider = await this.getOrCreateProvider(agentId)
    return provider.getState(agentId)
  }

  public async sendText(agentId: number, to: string, text: string) {
    const provider = await this.getOrCreateProvider(agentId)
    const kind = await this.getProviderKind(agentId)

    console.log(
      `[WhatsAppEngine] sendText() agentId=${agentId}, provider=${kind}, to=${to}`
    )

    return provider.sendText(agentId, to, text)
  }

  public async sendMedia(
    agentId: number,
    to: string,
    filePath: string,
    caption?: string
  ) {
    const provider = await this.getOrCreateProvider(agentId)
    const kind = await this.getProviderKind(agentId)

    console.log(
      `[WhatsAppEngine] sendMedia() agentId=${agentId}, provider=${kind}, to=${to}, filePath=${filePath}`
    )

    return provider.sendMedia(agentId, to, filePath, caption)
  }

  // --------------------------------------------------
  // Callbacks que os providers vão chamar
  // --------------------------------------------------
  private handleInboundMessage = async (msg: WaInboundMessage) => {
    console.log('[WhatsAppEngine] Mensagem recebida (router): WHATSAPPENGINE', {
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
    // aqui depois podemos sincronizar com tabela agents, logs, etc.
  }

  public async handleWebhook(agentId: number, payload: any): Promise<void> {
    const provider = await this.getOrCreateProvider(agentId)

    if (!provider.ingestWebhook) {
      throw new Error(`[WhatsAppEngine] Provider não suporta webhook: agentId=${agentId}`)
    }

    await provider.ingestWebhook(agentId, payload)
  }

}

const whatsAppEngine = new WhatsAppEngine()
export default whatsAppEngine
