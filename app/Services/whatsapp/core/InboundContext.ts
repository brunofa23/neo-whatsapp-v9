import { WaInboundMessage } from './IWhatsAppProvider'
import whatsAppEngine from './whatsappengine'

export type InboundContext = {
  msg: WaInboundMessage

  // responder para quem enviou
  reply: (text: string) => Promise<any>

  // enviar para qualquer destino
  sendText: (to: string, text: string) => Promise<any>

  // opcional (no começo pode ser noop)
  typing: () => Promise<void>

  // util
  fromResolvedJid: string   // p/ DB: fromPhoneJid ?? from
  fromDigits: string
}

export function makeCtx(msg: WaInboundMessage): InboundContext {
  const fromResolvedJid = (msg.fromPhoneJid || msg.from) as string
  const fromDigits = (msg.fromDigits || fromResolvedJid.replace(/\D/g, '')) || ''

  return {
    msg,
    fromResolvedJid,
    fromDigits,

    reply: (text) => whatsAppEngine.sendText(msg.agentId, msg.from, text),
    sendText: (to, text) => whatsAppEngine.sendText(msg.agentId, to, text),
    typing: async () => {}, // depois você implementa "digitando" por provider, se quiser
  }
}
