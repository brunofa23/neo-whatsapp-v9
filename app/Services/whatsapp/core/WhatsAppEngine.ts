// App/Services/whatsapp/core/WhatsAppEngine.ts

import { IWhatsAppProvider, WaInboundMessage, WaAck } from './IWhatsAppProvider'
import WWebJSProvider from 'App/Services/whatsapp/providers/wwebjs/WWebJSProvider'
import MessageRouter from './MessageRouter'

/**
 * Núcleo do WhatsApp.
 *
 * - Instancia o provider (WWebJSProvider por enquanto).
 * - Instancia o MessageRouter (que trata mensagens recebidas).
 * - Expõe métodos simples: startAgent, stopAgent, sendText, sendMedia, etc.
 */
class WhatsAppEngine {
  private provider: IWhatsAppProvider
  private router: MessageRouter

  constructor() {
    // provider que fala com o whatsapp-web.js
    this.provider = new WWebJSProvider()

    // router que trata mensagens de negócio (por enquanto: eco simples)
    this.router = new MessageRouter()

    // registra callbacks do provider
    this.provider.onMessage(this.handleInboundMessage)
    this.provider.onAck(this.handleAck)
    this.provider.onDisconnected(this.handleDisconnected)
  }

  /**
   * Só pra log/debug: qual provider está sendo usado (wwebjs / megaapi).
   */
  public getProviderKind() {
    return this.provider.kind
  }

  /**
   * Inicia a sessão de um agent.
   */
  public async startAgent(agentId: number): Promise<void> {
    console.log('[WhatsAppEngine] startAgent(' + agentId + ') usando provider: ' + this.provider.kind)
    await this.provider.start(agentId)
  }

  /**
   * Para/desconecta a sessão de um agent.
   */
  public async stopAgent(agentId: number): Promise<void> {
    await this.provider.stop(agentId)
  }

  /**
   * Pega o estado atual do provider para esse agent (CONNECTED, DISCONNECTED, etc.).
   */
  public async getState(agentId: number): Promise<string> {
    return this.provider.getState(agentId)
  }

  /**
   * Envia texto usando o provider.
   */
  public async sendText(agentId: number, to: string, text: string) {
    return this.provider.sendText(agentId, to, text)
  }

  /**
   * Envia mídia usando o provider.
   */
  public async sendMedia(agentId: number, to: string, filePath: string, caption?: string) {
    return this.provider.sendMedia(agentId, to, filePath, caption)
  }

  // =====================================================
  // HANDLERS internos para os callbacks do provider
  // =====================================================

  /**
   * Mensagem que chegou do WhatsApp (já normalizada em WaInboundMessage).
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

    // passa pelo router (onde está a regra de negócio)
    await this.router.handleInbound(msg)
  }

  /**
   * ACK recebido de uma mensagem enviada.
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

    // depois podemos plugar aqui atualização em Chat/Talk
  }

  /**
   * Sessão do agent desconectou.
   */
  private handleDisconnected = async (agentId: number, reason: string) => {
    console.log('[WhatsAppEngine] Agent desconectado:', { agentId, reason })

    // depois vamos plugar aqui:
    // - atualizar Agent
    // - parar loops
    // - sendMessageWarning etc.
  }
}

/**
 * Exporta uma ÚNICA instância (singleton).
 *
 * Isso é importante:
 * - no controller você importa `whatsAppEngine`
 * - e usa direto: `whatsAppEngine.startAgent(...)`
 */
const whatsAppEngine = new WhatsAppEngine()
export default whatsAppEngine
