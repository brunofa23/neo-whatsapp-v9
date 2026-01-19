// app/Controllers/Http/Webhooks/GupshupWebhookController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GupshupMonitoring from 'App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring'
import { MessageLike } from 'App/Services/whatsapp-gupshup-monitoring/types'
import Chat from 'App/Models/Chat'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {
    
    const payload = request.all()

    // ✅ responde 200 rápido
    response.status(200).send({ ok: true })

    // (opcional) log do payload bruto (cuidado com volume)
    // console.log('=== GUPSHUP WEBHOOK RECEBIDO ===')
    // console.log(JSON.stringify(payload, null, 2))
    // console.log('=== FIM ===')

    try {
      // ✅ 1) Eventos de status/ack (read/delivered/sent/played/failed...)
      const evt = parseMessageEvent(payload)
      if (evt) {
        const ack = mapEventToAck(evt.eventType)

        // salva ack no chat pelo gsId (que é o messageId do envio)
        const updated = await Chat.query()
          .where('gupshup_gs_id', evt.gsId)
          .update({
            ack,
            // opcional: se você tiver esses campos, descomente/ajuste
            // ack_date: DateTime.fromSeconds(evt.ts || DateTime.now().toSeconds()).toFormat('yyyy-MM-dd HH:mm'),
          })

        // loga só se não encontrou chat
        if (!updated) {
          await Log.create({
            name: 'gupshup_message_event_unmatched',
            message: JSON.stringify({
              at: DateTime.now().toISO(),
              gsId: evt.gsId,
              eventType: evt.eventType,
              ack,
              destination: evt.destination,
              ts: evt.ts,
            }),
            description: 'Evento de mensagem sem chat correspondente (gupshup_gs_id não encontrado)',
          })
        }

        return
      }

      // ✅ 2) Mensagens inbound (texto / quick_reply)
      const msg: MessageLike | null = parseInbound(payload)
      if (!msg) return

      await this.monitoring.handleInbound(msg)
    } catch (error) {
      await Log.create({
        name: 'GupshupWebhookError',
        message: error?.message || String(error),
        description: error?.stack || 'Sem stack',
      })
    }
  }
}

function mapEventToAck(eventTypeRaw: string): number {
  const t = String(eventTypeRaw || '').trim().toLowerCase()

  // seu pedido:
  // pendente=0, entregue=1, chegou no dispositivo=2, lida=3, played=4
  //
  // mapeamento prático com os nomes comuns da Gupshup:
  if (!t) return 0

  // "read" -> lida
  if (t === 'read') return 3

  // "played" -> played (áudio)
  if (t === 'played') return 4

  // "delivered" -> entregue (whatsapp entregou)
  if (t === 'delivered') return 1

  // "sent" -> não é "read", mas já saiu/chegou no dispositivo em muitos fluxos
  // (melhor aproximação para o seu ack=2)
  if (t === 'sent') return 2

  // estados pendentes
  if (t === 'submitted' || t === 'queued' || t === 'pending') return 0

  // falha: mantém 0 (pendente/sem confirmação). Se você quiser, pode usar -1.
  if (t === 'failed' || t === 'error' || t === 'undelivered') return 0

  // fallback: não reconhecido -> 0
  return 0
}

function parseMessageEvent(payload: any): null | {
  gsId: string
  eventType: string
  destination: string
  ts: number
  raw: any
} {
  if (payload?.type !== 'message-event') return null

  const p = payload?.payload || {}
  const gsId = String(p?.gsId || '').trim()
  const eventType = String(p?.type || '').trim()
  const destination = String(p?.destination || '').trim()
  const ts = Number(p?.payload?.ts || 0)

  if (!gsId || !eventType) return null

  return { gsId, eventType, destination, ts, raw: payload }
}

// ✅ seu parseInbound (com fallback extra)
function parseInbound(payload: any): MessageLike | null {
  if (payload?.type !== 'message') return null

  const p = payload?.payload || {}

  const from = p?.sender?.phone || p?.source
  if (!from) return null

  const text =
    p?.payload?.postbackText ||
    p?.payload?.text ||
    p?.payload?.payload?.text ||
    p?.text ||
    ''

  const inboundType = String(p?.type || 'text')
  const hasMedia = inboundType !== 'text' && inboundType !== 'quick_reply'

  const gsId = p?.context?.gsId || null
  const to = p?.destination || p?.to || ''

  return {
    from: String(from),
    to: String(to),
    body: String(text),
    hasMedia,
    context: gsId ? { gsId: String(gsId) } : undefined,
    raw: payload,
  }
}
