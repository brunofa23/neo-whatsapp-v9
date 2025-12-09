export type ProviderKind = 'wwebjs' | 'megaapi'

export type WaInboundMessage = {
  // origem
  provider: ProviderKind
  agentId: number

  // ids/jids originais do provider
  from: string              // ex: "5531...@c.us" ou "...@lid" ou "...@g.us"
  to: string                // jid do agente (wwebjs) ou equivalente (megaapi)
  body: string
  hasMedia: boolean

  messageId: string         // sempre preencher (dedupe depende disso)
  timestamp: number         // epoch ms

  // raw do provider (wwebjs Message, megaapi payload, etc.)
  raw?: unknown

  // ===== extras (para Router/DB e anti-loop) =====
  isGroup?: boolean         // true se msg.from termina com @g.us
  author?: string | null    // em grupo, quem escreveu (jid)
  fromPhoneJid?: string | null // se msg.from veio @lid, tentar resolver p/ "...@c.us"
  fromDigits?: string       // digits do remetente real (DM)
  authorDigits?: string     // digits do autor (grupo)
}

export type WaAck = {
  provider: ProviderKind
  agentId: number
  from: string
  to: string
  messageId: string
  ack: number
  timestamp: number
}

export interface IWhatsAppProvider {
  kind: ProviderKind

  start(agentId: number): Promise<void>
  stop(agentId: number): Promise<void>
  getState(agentId: number): Promise<string>

  sendText(agentId: number, to: string, text: string): Promise<any>
  sendMedia(agentId: number, to: string, filePath: string, caption?: string): Promise<any>

  onMessage(cb: (msg: WaInboundMessage) => Promise<void>): void
  onAck(cb: (ack: WaAck) => Promise<void>): void
  onDisconnected(cb: (agentId: number, reason: string) => Promise<void>): void
}
