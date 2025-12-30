// app/Controllers/Http/Webhooks/GupshupWebhookController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GupshupMonitoring from 'App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring'
import { MessageLike } from 'App/Services/whatsapp-gupshup-monitoring/types'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {
    const payload = request.all()

    console.log("passei no handle")

    // ✅ AQUI: mostra exatamente o que chegou
    console.log('=== GUPSHUP WEBHOOK RECEBIDO ===')
    console.log(JSON.stringify(payload, null, 2))
    console.log('=== FIM ===')
    // ✅ importante: responder 200 rápido
    response.status(200).send({ ok: true })

    // parse mínimo (você ajusta conforme seu payload real do gupshup)
    const msg: MessageLike | null = parseInbound(payload)
    if (!msg) return

    await this.monitoring.handleInbound(msg)
  }
}

// ajuste conforme o payload real que você recebe do Gupshup
function parseInbound(payload: any) {
  if (payload?.type !== 'message') return null

  const from =
    payload?.payload?.source ||
    payload?.payload?.sender?.phone

  const to =
    payload?.payload?.destination ||
    payload?.payload?.app

  const text =
    payload?.payload?.payload?.text || ''

  const type =
    payload?.payload?.type || 'text'

  const hasMedia = type !== 'text'

  if (!from) return null

  return {
    from: String(from),
    to: String(to || ''),
    body: String(text),
    hasMedia,
    raw: payload
  }
}
