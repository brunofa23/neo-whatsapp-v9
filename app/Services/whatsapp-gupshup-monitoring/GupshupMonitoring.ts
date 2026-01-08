// app/Services/whatsapp-gupshup-monitoring/GupshupMonitoring.ts
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'

// ✅ ConfirmSchedule exclusivo do Gupshup (sem whatsapp-web.js)
import ConfirmScheduleGupshup from './ConfirmScheduleGupshup'

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

/**
 * ✅ Preferencial: encontra chat pendente pelo gsId (correlação do botão)
 */
async function getChatByGsId(gsId: string) {
  const id = String(gsId || '').trim()
  if (!id) return null

  return Chat.query()
    .preload('shippingcampaign')
    .where('gupshup_gs_id', id) // ✅ coluna salva no envio (messageId)
    .whereNull('response')
    .orderBy('created_at', 'desc')
    .first()
}

/**
 * ✅ Fallback antigo: encontra chat pendente por telefone + chatnumber
 * (pode falhar se o webhook não trouxer "to", mas mantém compatibilidade)
 */
async function getChatByPhone(cellphone: string, agentPhone: string) {
  const phoneAgent = onlyDigits(agentPhone)
  const phoneClient = onlyDigits(cellphone)

  if (!phoneClient) return null

  const q = Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', phoneClient)
    .whereNull('response')
    .orderBy('created_at', 'desc')

  // só filtra por chatnumber se veio agentPhone
  if (phoneAgent) q.andWhere('chatnumber', phoneAgent)

  return q.first()
}

export default class GupshupMonitoring {
  /**
   * Entrada única do webhook (MessageLike já parseado)
   * Espera:
   * - message.from
   * - message.to (pode ser vazio)
   * - message.body
   * - message.hasMedia
   * - message.context?.gsId (✅ quando for quick_reply)
   */
  public async handleInbound(message: any) {
    const fromDigits = onlyDigits(message?.from)
    const toDigits = onlyDigits(message?.to)
    const body = String(message?.body || '')
    const hasMedia = !!message?.hasMedia

    // ✅ pega gsId do contexto (vem no webhook: payload.context.gsId quando é botão)
    const inboundGsId = String(message?.context?.gsId || '').trim()

    // ✅ log rápido pra depuração
    await Log.create({
      name: 'gupshup_inbound',
      message: JSON.stringify({
        at: DateTime.now().toISO(),
        from: fromDigits,
        to: toDigits || null,
        gsId: inboundGsId || null,
        body: body.slice(0, 200),
        hasMedia,
      }),
      description: 'GUPSHUP WEBHOOK INBOUND',
    })

    // ✅ registra inbound no talk
    // (mantém chatnumber mesmo que vazio)
    await Talk.create({
      cellphone: fromDigits,
      chatnumber: toDigits,
      message: body.slice(0, 999),
      type: 'from',
    })

    // ✅ 1) tenta localizar chat pendente pelo gsId (preferencial)
    let chat: any = null
    if (inboundGsId) {
      chat = await getChatByGsId(inboundGsId)
    }

    // ✅ 2) fallback por telefone (se for texto normal ou gsId não achou)
    if (!chat) {
      chat = await getChatByPhone(fromDigits, toDigits)
    }

    console.log(
      'GUPSHUP MONITORING => chat encontrado?',
      !!chat,
      'from',
      fromDigits,
      'to',
      toDigits || '-',
      'gsId',
      inboundGsId || '-'
    )

    if (!chat) {
      // 1) ignorar
      // 2) responder "não encontrei campanha ativa"
      // 3) cair no seu fluxo de IA
      return
    }

    // ✅ apenas fluxo 1 por enquanto
    if (chat.interaction_id === 1) {
      await ConfirmScheduleGupshup(
        {
          from: fromDigits,
          to: toDigits, // pode ser vazio; ConfirmSchedule pode ignorar
          body,
          hasMedia,
          context: inboundGsId ? { gsId: inboundGsId } : undefined,
        },
        chat
      )
      return
    }

    // ✅ preparado pros próximos fluxos (quando você quiser)
    // if (chat.interaction_id === 2) {
    //   await ServiceEvaluationGupshup({ from: fromDigits, to: toDigits, body, hasMedia }, chat)
    // }
  }
}
