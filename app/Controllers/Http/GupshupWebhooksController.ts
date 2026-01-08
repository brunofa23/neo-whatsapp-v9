// app/Controllers/Http/Webhooks/GupshupWebhookController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GupshupMonitoring from 'App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring'
import { MessageLike } from 'App/Services/whatsapp-gupshup-monitoring/types'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {
    const payload = request.all()

    console.log('passei no handle')

    // ✅ AQUI: mostra exatamente o que chegou
    console.log('=== GUPSHUP WEBHOOK RECEBIDO ===')
    console.log(JSON.stringify(payload, null, 2))
    console.log('=== FIM ===')

    // ✅ importante: responder 200 rápido
    response.status(200).send({ ok: true })

    // ✅ parse mínimo
    const msg: MessageLike | null = parseInbound(payload)
    if (!msg) return

    await this.monitoring.handleInbound(msg)
  }
}

// ajuste conforme o payload real que você recebe do Gupshup
function parseInbound(payload: any): MessageLike | null {
  if (payload?.type !== 'message') return null

  const p = payload?.payload || {}

  // ✅ remetente (cliente)
  const from = p?.sender?.phone || p?.source
  if (!from) return null

  // ✅ texto: quick_reply vem em payload.payload.postbackText / text
  // ✅ texto normal costuma vir em payload.payload.text
  // ✅ alguns payloads podem vir em payload.payload.payload.text (fallback)
  const text =
    p?.payload?.postbackText ||
    p?.payload?.text ||
    p?.payload?.payload?.text ||
    p?.text ||
    ''

  // ✅ tipo
  const inboundType = String(p?.type || 'text')
  const hasMedia = inboundType !== 'text' && inboundType !== 'quick_reply'

  // ✅ contexto pra correlação (id da mensagem original enviada)
  const gsId = p?.context?.gsId || null

  // ✅ "to" não é confiável no webhook; mantém algum valor só pra log/fallback
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

