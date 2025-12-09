// app/Services/whatsapp/core/InboundContext.ts

import { WaInboundMessage } from './IWhatsAppProvider'
import whatsAppEngine from './WhatsAppEngine'

export type InboundContext = {
  msg: WaInboundMessage

  // responder para quem enviou
  reply: (text: string) => Promise<any>

  // enviar para qualquer destino
  sendText: (to: string, text: string) => Promise<any>

  // opcional (no começo pode ser noop)
  typing: () => Promise<void>

  // util
  fromResolvedJid: string   // SEMPRE algo tipo 5531...@c.us
  fromDigits: string        // somente dígitos (para anti-loop / agentes internos)
}

export function makeCtx(msg: WaInboundMessage): InboundContext {
  // 1) prioriza o que o provider já resolveu (fromPhoneJid)
  // 2) senão, usa msg.from (do wwebjs, que também já vem @c.us)
  const baseJid = (msg.fromPhoneJid || msg.from || '').trim()

  // garantir que não vamos mutilar o JID
  const fromResolvedJid = baseJid

  // dígitos só para lógica de comparação (NUNCA salvar isso em cellphoneserialized)
  const fromDigits = msg.fromDigits || fromResolvedJid.replace(/\D/g, '') || ''

  return {
    msg,
    fromResolvedJid,
    fromDigits,

    reply: (text) => whatsAppEngine.sendText(msg.agentId, msg.from, text),
    sendText: (to, text) => whatsAppEngine.sendText(msg.agentId, to, text),
    typing: async () => {}, // depois você implementa "digitando" por provider, se quiser
  }
}
