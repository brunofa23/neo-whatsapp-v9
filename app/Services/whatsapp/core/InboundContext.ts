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
  fromResolvedJid: string   // p/ DB: fromPhoneJid ?? from (preferir @c.us)
  fromDigits: string        // 5531...
}

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

function toCusJid(digits: string) {
  return digits ? `${digits}@c.us` : ''
}

export function makeCtx(msg: WaInboundMessage): InboundContext {
  // 1) resolve jid "melhor" (se o provider conseguiu converter lid -> c.us)
  const fromResolvedJid = (msg.fromPhoneJid || msg.from) as string

  // 2) dígitos do remetente (para fallback)
  const fromDigits =
    (msg.fromDigits || onlyDigits(fromResolvedJid) || '').trim()

  // 3) destino de reply (sempre que possível: @c.us)
  // - se já for @c.us, usa ele
  // - se for @lid (ou algo diferente), tenta montar digits@c.us
  const replyTo =
    fromResolvedJid?.endsWith('@c.us')
      ? fromResolvedJid
      : (toCusJid(fromDigits) || fromResolvedJid)

  return {
    msg,
    fromResolvedJid,
    fromDigits,

    // ✅ responde no padrão certo (resolve problema de @lid)
    reply: (text) => whatsAppEngine.sendText(msg.agentId, replyTo, text),

    sendText: (to, text) => whatsAppEngine.sendText(msg.agentId, to, text),

    typing: async () => {}, // depois você implementa "digitando" por provider, se quiser
  }
}
