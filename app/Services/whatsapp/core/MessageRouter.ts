import Talk from 'App/Models/Talk'
import { WaInboundMessage } from './IWhatsAppProvider'
import whatsAppEngine from './WhatsAppEngine'

export default class MessageRouter {
  public async handleInbound(msg: WaInboundMessage) {
    if (this.shouldIgnore(msg)) return

    await Talk.create({
      cellphone: msg.from,
      chatnumber: msg.to,
      message_ack: 0,
      message: msg.body.slice(0, 999),
      type: 'from',
    })

    const resposta = `Recebido pelo novo engine (${msg.provider}) -> "${msg.body}"`

    await whatsAppEngine.sendText(msg.agentId, msg.from, resposta)

    await Talk.create({
      cellphone: msg.from,
      chatnumber: msg.to,
      message_ack: 0,
      message: resposta.slice(0, 999),
      type: 'to',
    })
  }

  private shouldIgnore(msg: WaInboundMessage): boolean {
    if (!msg.body && !msg.hasMedia) return true
    if (msg.from.includes('@broadcast') || msg.from.includes('@status')) return true
    return false
  }
}
