import {
  IWhatsAppProvider,
  WaInboundMessage,
  WaAck,
} from './IWhatsAppProvider'
import WWebJSProvider from 'App/Services/whatsapp/providers/wwebjs/WWebJSProvider'
import MessageRouter from './MessageRouter'

class WhatsAppEngine {
  private provider: IWhatsAppProvider
  private router: MessageRouter

  constructor() {
    this.provider = new WWebJSProvider()
    this.router = new MessageRouter()

    this.provider.onMessage(this.handleInboundMessage)
    this.provider.onAck(this.handleAck)
    this.provider.onDisconnected(this.handleDisconnected)
  }

  public getProviderKind() {
    return this.provider.kind
  }

  public async startAgent(agentId: number): Promise<void> {
    console.log('[WhatsAppEngine] startAgent(' + agentId + ') usando provider: ' + this.provider.kind)
    await this.provider.start(agentId)
  }

  public async stopAgent(agentId: number): Promise<void> {
    await this.provider.stop(agentId)
  }

  public async getState(agentId: number): Promise<string> {
    return this.provider.getState(agentId)
  }

  public async sendText(agentId: number, to: string, text: string) {
    return this.provider.sendText(agentId, to, text)
  }

  public async sendMedia(agentId: number, to: string, filePath: string, caption?: string) {
    return this.provider.sendMedia(agentId, to, filePath, caption)
  }

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
