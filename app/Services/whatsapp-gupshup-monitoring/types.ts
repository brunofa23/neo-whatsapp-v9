// app/Services/whatsapp-gupshup-monitoring/types.ts
export type MessageLike = {
  from: string      // ex: "5531999999999@c.us" ou só "5531..."
  to: string        // seu número/waba (pode ser o destination do payload)
  body: string
  hasMedia: boolean
  raw?: any
}
