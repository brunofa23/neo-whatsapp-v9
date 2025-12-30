// app/Controllers/Http/Webhooks/GupshupWebhookController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GupshupMonitoring from 'App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring'
import { MessageLike } from 'App/Services/whatsapp-gupshup-monitoring/types'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {
    const payload = request.all()

    // ✅ importante: responder 200 rápido
    response.status(200).send({ ok: true })

    // parse mínimo (você ajusta conforme seu payload real do gupshup)
    const msg: MessageLike | null = parseInbound(payload)
    if (!msg) return

    await this.monitoring.handleInbound(msg)
  }
}

// ajuste conforme o payload real que você recebe do Gupshup
function parseInbound(payload: any): MessageLike | null {
  // Exemplos comuns:
  // payload.payload?.sender?.phone
  // payload.payload?.source
  // payload.payload?.payload?.text
  // payload.payload?.payload?.type

  const from = payload?.payload?.sender?.phone || payload?.payload?.source || payload?.sender?.phone
  const to = payload?.payload?.destination || payload?.payload?.app || payload?.destination

  const text =
    payload?.payload?.payload?.text ||
    payload?.payload?.message?.text ||
    payload?.message?.text ||
    payload?.text ||
    ''

  const type =
    payload?.payload?.payload?.type ||
    payload?.payload?.type ||
    payload?.type ||
    'text'

  const hasMedia = type !== 'text' && type !== 'quick_reply' && type !== 'button_reply'

  if (!from) return null

  return {
    from: String(from),
    to: String(to || ''),
    body: String(text || ''),
    hasMedia,
    raw: payload,
  }
}
