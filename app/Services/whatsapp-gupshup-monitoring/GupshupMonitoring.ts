// app/Services/whatsapp-gupshup-monitoring/GupshupMonitoring.ts
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'

// ✅ ConfirmSchedule exclusivo do Gupshup (sem whatsapp-web.js)
import ConfirmScheduleGupshup from './ConfirmScheduleGupshup'
import ServiceEvaluationGupshup from './ServiceEvaluationGupshup'


// ✅ (opcional) serviço da avaliação, quando você tiver
// import ServiceEvaluationGupshup from './ServiceEvaluationGupshup'

// ✅ função de normalização vinda do seu util
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

/**
 * JSON.stringify seguro (evita crash por circular / bigints)
 */
function safeStringify(value: any) {
  const seen = new WeakSet()
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === 'bigint') return val.toString()
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]'
        seen.add(val)
      }
      return val
    },
    2
  )
}

/**
 * ✅ Preferencial: encontra chat pendente pelo gsId (correlação do botão)
 */
async function getChatByGsId(gsId: string) {
  const id = String(gsId || '').trim()
  if (!id) return null

  return Chat.query()
    .preload('shippingcampaign')
    .where('gupshup_gs_id', id) // coluna salva no envio (messageId)
    .whereNull('response')
    .orderBy('created_at', 'desc')
    .first()
}

/**
 * ✅ Fallback: encontra chat pendente por telefone + chatnumber
 * usando a CHAVE NORMALIZADA em cellphoneserialized.
 *
 * interactionId (opcional): se informado, filtra por interaction_id.
 */
async function getChatByPhone(
  cellphone: string,
  agentPhone: string,
  interactionId?: number
) {
  const phoneClientKey = normalizePhoneKey(cellphone)
  const phoneAgentKey = normalizePhoneKey(agentPhone)

  if (!phoneClientKey) return null

  const q = Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', phoneClientKey)
    .whereNull('response')
    .orderBy('created_at', 'desc')

  if (phoneAgentKey) {
    q.andWhere('chatnumber', phoneAgentKey)
  }

  if (interactionId !== undefined) {
    q.andWhere('interaction_id', interactionId)
  }

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
   * - message.context?.gsId (quando for quick_reply)
   */
  public async handleInbound(message: any) {
    // ==========================================================
    // ✅ LOG BRUTO: salva TODO o conteúdo do webhook para debugar
    // ==========================================================
    const MAX_LOG_LEN = 65000 // segurança (caso a coluna seja VARCHAR/TEXT)
    const raw = safeStringify({
      at: DateTime.now().toISO(),
      webhook: message,
    })

    console.log('PASSO 1 1544')

    const truncated = raw.length > MAX_LOG_LEN
    await Log.create({
      name: 'webhook', // tudo que chegar aqui vai com name=webhook
      message: truncated ? raw.slice(0, MAX_LOG_LEN) : raw,
      description: truncated ? 'GUPSHUP WEBHOOK RAW (TRUNCATED)' : 'GUPSHUP WEBHOOK RAW',
    })

    // -------------------------
    // fluxo normal
    // -------------------------
    const fromDigits = onlyDigits(message?.from)
    const toDigits = onlyDigits(message?.to)

    // chaves normalizadas para bater com cellphoneserialized
    const fromKey = normalizePhoneKey(message?.from)
    const toKey = normalizePhoneKey(message?.to)

    const body = String(message?.body || '')
    const hasMedia = !!message?.hasMedia

    // pega gsId do contexto (vem no webhook: payload.context.gsId quando é botão)
    const inboundGsId = String(message?.context?.gsId || '').trim()

    // ✅ log rápido pra depuração
    await Log.create({
      name: 'gupshup_inbound',
      message: JSON.stringify({
        at: DateTime.now().toISO(),
        from: fromDigits,
        fromKey,
        to: toDigits || null,
        toKey: toKey || null,
        gsId: inboundGsId || null,
        body: body.slice(0, 200),
        hasMedia,
      }),
      description: 'GUPSHUP WEBHOOK INBOUND',
    })

    // ✅ registra inbound no talk (mantém o formato que você já usava)
    await Talk.create({
      cellphone: fromDigits, // ex: 5531985228619
      cellphoneserialized:fromKey,
      chatnumber: toDigits,  // ex: 553185228619 ou vazio

      message: body.slice(0, 999),
      type: 'from',
    })

    // =======================================================
    // 1) tenta localizar chat pendente pelo gsId (botões)
    // =======================================================
    let chat: any = null
    if (inboundGsId) {
      chat = await getChatByGsId(inboundGsId)
    }

    // =======================================================
    // 2) Fallback SEM gsId: preferir interaction_id = 2
    //    (fluxo de avaliação) e, se não achar, pegar genérico
    // =======================================================
    if (!chat) {
      // 👉 aqui entra exatamente o caso que você descreveu:
      // mensagem SEM gsId e queremos pegar a campanha de avaliação (interaction_id = 2)
      const evaluationChat = await getChatByPhone(fromDigits, toDigits, 2)

      // se não houver campanha de avaliação pendente, cai pro genérico
      chat = evaluationChat || (await getChatByPhone(fromDigits, toDigits))
    }

    console.log(
      'GUPSHUP MONITORING => chat encontrado?',
      !!chat,
      'fromDigits',
      fromDigits,
      'fromKey',
      fromKey,
      'toDigits',
      toDigits || '-',
      'toKey',
      toKey || '-',
      'gsId',
      inboundGsId || '-'
    )

    if (!chat) {
      // aqui você define:
      // 1) ignorar
      // 2) responder "não encontrei campanha ativa"
      // 3) cair no fluxo de IA
      return
    }

    // =======================================================
    // FLUXOS POR interaction_id
    // =======================================================

    // ✅ fluxo 1 (Confirmação de agenda)
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

    if (chat.interaction_id === 2) {
      await ServiceEvaluationGupshup(
        {
          from: fromDigits,
          to: toDigits,
          body,
          hasMedia,
          context: inboundGsId ? { gsId: inboundGsId } : undefined,
        },
        chat
      )
      return
    }



    // ✅ preparado para próximos fluxos (3, 4, etc.)
    // if (chat.interaction_id === 3) { ... }
  }
}
