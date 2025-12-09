export type ProviderKind = 'wwebjs' | 'megaapi'

export type WaInboundMessage = {
  provider: ProviderKind
  agentId: number

  // endereços "nativos" do provider
  from: string
  to: string

  body: string
  hasMedia: boolean
  messageId: string
  timestamp: number

  // ✅ extras para o router (opcional, mas MUITO útil)
  isGroup?: boolean
  author?: string | null          // grupos
  fromDigits?: string             // só dígitos quando possível
  authorDigits?: string
  fromPhoneJid?: string | null    // quando resolver lid -> c.us (wwebjs)
  raw?: any
}

export type WaAck = {
  provider: ProviderKind
  agentId: number
  from: string
  to: string
  messageId: string
  ack: any
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

  // ✅ só providers webhook (MegaAPI)
  ingestWebhook?: (agentId: number, payload: any) => Promise<void>
}
