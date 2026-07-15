// app/Services/whatsapp-gupshup-monitoring/GupshupMonitoring.ts
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import Response from 'App/Models/Response'
import { DateTime } from 'luxon'

// ✅ novos imports para o fluxo de customchat via Gupshup
import Agent from 'App/Models/Agent'
import Customchat from 'App/Models/Customchat'

// ✅ ConfirmSchedule exclusivo do Gupshup (sem whatsapp-web.js)
import ConfirmScheduleGupshup from './ConfirmScheduleGupshup'
import ServiceEvaluationGupshup from './ServiceEvaluationGupshup'
import SendTextGupshup from 'App/Services/whatsapp-gupshup/SendTextGupshup'

// ✅ função de normalização vinda do seu util
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

const EVALUATION_RESPONSE_LIMIT_HOURS = 72
const EVALUATION_EXPIRED_MESSAGE =
  'Olá! O prazo para responder esta mensagem expirou. As respostas são aceitas em até 72 horas após o envio. Obrigado.'
const WAITING_TIME_RESPONSE_LOCAL = 'waiting_time_keyword'
const WAITING_TIME_KEYWORDS = ['tempo de espera', 'pontualidade', 'atraso']
const WAITING_TIME_DEFAULT_MESSAGE =
  'Olá! Agradecemos o seu contato. A sua satisfação é muito importante para nós. No momento do agendamento, informamos que o tempo estimado de permanência no NEO é de cerca de duas horas, informação que também é reforçada na confirmação enviada por WhatsApp. O horário agendado corresponde ao início do atendimento, que pode variar conforme a necessidade de exames e da dilatação da pupila.'

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

function normalizeText(value: any) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasWaitingTimeKeyword(body: string) {
  const normalizedBody = normalizeText(body)

  return WAITING_TIME_KEYWORDS.some((keyword) => normalizedBody.includes(normalizeText(keyword)))
}

async function getWaitingTimeResponseMessage() {
  const response = await Response.query()
    .select('message')
    .where('local', WAITING_TIME_RESPONSE_LOCAL)
    .andWhere('inactive', false)
    .orderBy('id', 'desc')
    .first()

  return response?.message || WAITING_TIME_DEFAULT_MESSAGE
}

async function getGupshupAgentByAppName(appName: string) {
  const name = String(appName || '').trim()
  if (!name) return null

  return Agent.query()
    .where('gupshup_src_name', name)
    .where('active', true)
    .where((query) => query.whereNull('deleted').orWhere('deleted', false))
    .first()
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
async function getChatByPhone(cellphone: string, agentPhone: string, interactionId?: number) {
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

function getChatCreatedAt(chat: any) {
  const createdAt = chat?.createdAt || chat?.created_at
  if (!createdAt) return null
  if (DateTime.isDateTime(createdAt)) return createdAt
  if (createdAt instanceof Date) return DateTime.fromJSDate(createdAt)

  const parsedIso = DateTime.fromISO(String(createdAt))
  if (parsedIso.isValid) return parsedIso

  return DateTime.fromSQL(String(createdAt))
}

function isEvaluationResponseExpired(chat: any) {
  if (Number(chat?.interaction_id) !== 2) return false

  const createdAt = getChatCreatedAt(chat)
  if (!createdAt?.isValid) return false

  return createdAt.plus({ hours: EVALUATION_RESPONSE_LIMIT_HOURS }) < DateTime.now()
}

async function sendEvaluationExpiredMessage(chat: any, fromDigits: string, toDigits: string) {
  const source = onlyDigits(chat?.chatnumber || '') || toDigits
  const destination = onlyDigits(fromDigits)

  if (!source || !destination) {
    await Log.create({
      name: 'GupshupEvaluationExpiredNoSource',
      message: JSON.stringify({
        chat_id: chat?.id ?? null,
        source,
        destination,
      }),
      description: 'Não foi possível enviar aviso de avaliação expirada',
    })
    return
  }

  await SendTextGupshup({
    source,
    destination,
    text: EVALUATION_EXPIRED_MESSAGE,
  })

  await Talk.create({
    chat_id: chat.id,
    reg: chat.reg,
    cellphone: destination,
    cellphoneserialized: normalizePhoneKey(destination) || null,
    chatnumber: source,
    message_ack: 0,
    message: EVALUATION_EXPIRED_MESSAGE,
    type: 'to',
  } as any)
}

async function sendWaitingTimeKeywordResponse(chat: any, fromDigits: string, toDigits: string, sourceFallback = '') {
  const source = onlyDigits(chat?.chatnumber || '') || toDigits || onlyDigits(sourceFallback)
  const destination = onlyDigits(fromDigits)

  if (!source || !destination) {
    await Log.create({
      name: 'GupshupWaitingTimeNoSource',
      message: JSON.stringify({
        chat_id: chat?.id ?? null,
        source,
        sourceFallback,
        destination,
      }),
      description: 'Não foi possível enviar resposta automática sobre tempo de espera',
    })
    return
  }

  const text = await getWaitingTimeResponseMessage()

  await SendTextGupshup({
    source,
    destination,
    text,
  })

  await Talk.create({
    chat_id: chat?.id ?? null,
    reg: chat?.reg ?? null,
    cellphone: destination,
    cellphoneserialized: normalizePhoneKey(destination) || null,
    chatnumber: source,
    message_ack: 0,
    message: text.slice(0, 999),
    type: 'to',
  } as any)
}

async function saveInboundTalk(fromDigits: string, fromKey: string | null, chatnumber: string, body: string) {
  await Talk.create({
    cellphone: fromDigits,
    cellphoneserialized: fromKey,
    chatnumber,
    message: body.slice(0, 999),
    type: 'from',
  } as any)
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
   * - message.appName / message.app / payload.app (nome do app Gupshup)
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
    // await Log.create({ ... })

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

    // ✅ (áudio padronizado) controller injeta em raw.path_media
    const inboundPathMedia = String(message?.raw?.path_media || '').trim()

    // pega gsId do contexto (vem no webhook: payload.context.gsId quando é botão)
    const inboundGsId = String(message?.context?.gsId || '').trim()

    // ==========================================================
    // 🔹 NOVO: pegar nome do app vindo da Gupshup
    // ==========================================================
    const appName = String(
      message?.appName ||
        message?.app ||
        message?.payload?.appName ||
        message?.payload?.app ||
        message?.raw?.app ||
        ''
    ).trim()

    const gupshupAgent = await getGupshupAgentByAppName(appName)
    const sourceFallback = onlyDigits(gupshupAgent?.gupshup_source || '')
    const defaultAgent = gupshupAgent?.default_chat ? gupshupAgent : null

    if (body && hasWaitingTimeKeyword(body)) {
      await saveInboundTalk(fromDigits, fromKey, sourceFallback || toDigits, body)
      await sendWaitingTimeKeywordResponse(null, fromDigits, toDigits, sourceFallback)
      return
    }

    // ==========================================================
    // CASO ESPECIAL: app marcado como default_chat → CUSTOMCHAT
    // ==========================================================
    if (defaultAgent) {
      console.log('ENTREI NO DEFAULT...')
      console.log('.....', appName)

      const query = Customchat.query()
        .where('cellphoneserialized', fromKey)
        //.andWhere('chatnumber', toDigits)
        .andWhere('chatname', appName)
        .andWhereNull('returned')
        .orderBy('created_at', 'desc')

      const openCustom = await query.first()

      console.log('>>>>>>>>>111111>', query.toQuery())

      // ✅ FIX (somente para áudio padronizado e NÃO quebrar): chats_id é obrigatório
      // Se não tiver chat aberto pra amarrar, não grava (não cria Chat)
      if (!openCustom?.chats_id) {
        console.log('❌ DEFAULT_CHAT: não encontrei openCustom com chats_id. Não vou criar Chat. Abortando.', {
          appName,
          fromKey,
          fromDigits,
          toDigits,
          hasMedia,
          inboundPathMedia: inboundPathMedia || null,
        })
        return
      }

      await Customchat.create({
        chats_id: openCustom.chats_id,
        reg: openCustom?.reg || null,
        cellphone: openCustom?.cellphone || fromDigits,
        cellphoneserialized: fromKey,
        chatnumber: toDigits || null,
        chatname: appName || null,
        returned: true,
        viewed: false,
        response: body ? body.slice(0, 999) : '',
        path_media: hasMedia && inboundPathMedia ? inboundPathMedia : null, // ✅ áudio igual texto, mas com path_media
      })

      return
    }

    // ==========================================================
    // Se NÃO for app default_chat → segue fluxo normal
    // ==========================================================

    await saveInboundTalk(fromDigits, fromKey, toDigits, body)

    let chat: any = null
    if (inboundGsId) {
      chat = await getChatByGsId(inboundGsId)
    }

    if (!chat) {
      const evaluationChat = await getChatByPhone(fromDigits, toDigits, 2)
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
      inboundGsId || '-',
      'appName',
      appName || '-'
    )

    if (!chat) {
      return
    }

    if (isEvaluationResponseExpired(chat)) {
      await sendEvaluationExpiredMessage(chat, fromDigits, toDigits)
      return
    }

    if (chat.interaction_id === 1) {
      await ConfirmScheduleGupshup(
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
  }
}
