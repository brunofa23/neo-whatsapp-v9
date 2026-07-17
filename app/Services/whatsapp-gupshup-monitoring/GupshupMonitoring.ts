// app/Services/whatsapp-gupshup-monitoring/GupshupMonitoring.ts
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import Response from 'App/Models/Response'
import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'
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
const WAITING_TIME_KEYWORDS = [
  'tempo de espera',
  'pontualidade',
  'atraso',
  'demora no atendimento',
  'demora atendimento',
  'atendimento demorado',
  'muita demora',
  'muito demorado',
  'demorou muito',
  'demorando muito',
  'demorou demais',
  'demora demais',
  'demorado demais',
  'esperei muito',
  'esperei demais',
  'fiquei esperando',
  'horas esperando',
]
const WAITING_TIME_SIGNAL_GROUPS = [
  ['demora', 'atendimento'],
  ['demorou', 'atendimento'],
  ['demorado', 'atendimento'],
  ['demorando', 'atendimento'],
  ['esperei', 'atendimento'],
  ['esperando', 'atendimento'],
  ['espera', 'atendimento'],
  ['tempo', 'atendimento'],
  ['horas', 'atendimento'],
  ['cheguei', 'sai'],
  ['cheguei', 'saida'],
  ['cheguei', 'demorou'],
  ['cheguei', 'demora'],
  ['cheguei', 'horas'],
  ['consulta', 'atrasou'],
  ['consulta', 'demorou'],
  ['consulta', 'demora'],
  ['medico', 'atrasou'],
  ['medico', 'demorou'],
]
const WAITING_TIME_DEFAULT_MESSAGE =
  'Olá! Agradecemos o seu contato. A sua satisfação é muito importante para nós. No momento do agendamento, informamos que o tempo estimado de permanência no NEO é de cerca de duas horas, informação que também é reforçada na confirmação enviada por WhatsApp. O horário agendado corresponde ao início do atendimento, que pode variar conforme a necessidade de exames e da dilatação da pupila.'
const WAITING_TIME_CLASSIFIER_DEFAULT_MODEL = 'llama-3.1-8b-instant'
let lastAiAlertSentAt: DateTime | null = null

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

function normalizeText(value: any) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function shouldClassifyWaitingTimeIntent(body: string) {
  const normalizedBody = normalizeText(body)

  if (WAITING_TIME_KEYWORDS.some((keyword) => normalizedBody.includes(normalizeText(keyword)))) {
    return true
  }

  return WAITING_TIME_SIGNAL_GROUPS.some((signals) =>
    signals.every((signal) => normalizedBody.includes(normalizeText(signal)))
  )
}

function envBoolean(key: string, defaultValue: boolean) {
  const value = String(Env.get(key, defaultValue ? 'true' : 'false')).trim().toLowerCase()
  return ['1', 'true', 'yes', 'sim', 'on'].includes(value)
}

function getClassifierThreshold() {
  const threshold = Number(Env.get('WAITING_TIME_INTENT_THRESHOLD', 0.8))
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) return 0.8
  return threshold
}

function getAiAlertCooldownMinutes() {
  const minutes = Number(Env.get('AI_ALERT_COOLDOWN_MINUTES', 30))
  if (!Number.isFinite(minutes) || minutes < 1) return 30
  return minutes
}

function shouldSendAiAlert() {
  if (!envBoolean('AI_ALERT_WHATSAPP_ENABLED', false)) return false

  const now = DateTime.now()
  const cooldownMinutes = getAiAlertCooldownMinutes()

  if (lastAiAlertSentAt && lastAiAlertSentAt.plus({ minutes: cooldownMinutes }) > now) {
    return false
  }

  lastAiAlertSentAt = now
  return true
}

function getGroqErrorMessage(error: any) {
  const status = error?.response?.status
  const statusText = error?.response?.statusText
  const apiError = error?.response?.data?.error?.message || error?.response?.data?.message
  return [status, statusText, apiError || error?.message || String(error)].filter(Boolean).join(' - ')
}

async function notifyAiClassifierFailure(params: {
  error: any
  body: string
  appName: string
  fromDigits: string
  source: string
  chat?: any
}) {
  if (!shouldSendAiAlert()) return

  const destination = onlyDigits(Env.get('AI_ALERT_WHATSAPP_PHONE', ''))
  const source = onlyDigits(Env.get('AI_ALERT_WHATSAPP_SOURCE', params.source))

  if (!destination || !source) {
    await Log.create({
      name: 'GupshupAiAlertConfigError',
      message: JSON.stringify({ destination, source }),
      description: 'AI_ALERT_WHATSAPP_PHONE ou AI_ALERT_WHATSAPP_SOURCE não configurado',
    })
    return
  }

  const text = [
    'Falha na IA Groq',
    `App: ${params.appName || '-'}`,
    `Paciente: ${params.fromDigits || '-'}`,
    `Chat: ${params.chat?.id ?? '-'}`,
    `Erro: ${getGroqErrorMessage(params.error).slice(0, 500)}`,
    `Mensagem: ${String(params.body || '').slice(0, 300)}`,
    `Momento: ${DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss')}`,
  ].join('\n')

  try {
    await SendTextGupshup({
      source,
      destination,
      text,
    })

    await Log.create({
      name: 'GupshupAiAlertSent',
      message: JSON.stringify({ destination, source, patient: params.fromDigits || null }),
      description: getGroqErrorMessage(params.error).slice(0, 1000),
    })
  } catch (alertError) {
    await Log.create({
      name: 'GupshupAiAlertSendError',
      message: alertError?.message || String(alertError),
      description: alertError?.stack || 'Erro ao enviar alerta de falha da IA',
    })
  }
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

async function getRecentTalkContext(fromKey: string | null, fromDigits: string, chatnumber: string) {
  try {
    const query = Talk.query()
      .select(['message', 'type', 'chatnumber', 'created_at'])
      .orderBy('created_at', 'desc')
      .limit(8)

    if (fromKey) {
      query.where('cellphoneserialized', fromKey)
    } else {
      query.where('cellphone', fromDigits)
    }

    if (chatnumber) {
      query.andWhere('chatnumber', chatnumber)
    }

    const rows = await query

    return rows
      .reverse()
      .map((talk) => ({
        type: talk.type,
        chatnumber: talk.chatnumber,
        message: String(talk.message || '').slice(0, 500),
        created_at: (talk as any).createdAt?.toISO?.() || null,
      }))
  } catch (error) {
    await Log.create({
      name: 'GupshupWaitingTimeContextError',
      message: error?.message || String(error),
      description: error?.stack || 'Erro ao buscar contexto em talks',
    })
    return []
  }
}

function parseClassifierJson(raw: string) {
  const text = String(raw || '').trim()
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const jsonStart = cleaned.indexOf('{')
  const jsonEnd = cleaned.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null

  try {
    return JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1))
  } catch {
    return null
  }
}

async function classifyWaitingTimeIntent(params: {
  body: string
  appName: string
  fromDigits: string
  fromKey: string | null
  source: string
  chat?: any
}) {
  const apiKey = Env.get('GROQ_API_KEY')
  if (!apiKey) {
    await Log.create({
      name: 'GupshupWaitingTimeClassifierError',
      message: 'GROQ_API_KEY não configurada',
      description: 'Não foi possível classificar intenção de tempo de espera sem GROQ_API_KEY',
    })

    await notifyAiClassifierFailure({
      error: new Error('GROQ_API_KEY não configurada'),
      body: params.body,
      appName: params.appName,
      fromDigits: params.fromDigits,
      source: params.source,
      chat: params.chat,
    })

    return null
  }

  const context = await getRecentTalkContext(params.fromKey, params.fromDigits, params.source)
  const threshold = getClassifierThreshold()

  const payload = {
    currentMessage: params.body,
    appName: params.appName || null,
    chat: params.chat
      ? {
          id: params.chat.id ?? null,
          interaction_id: params.chat.interaction_id ?? null,
          interaction_seq: params.chat.interaction_seq ?? null,
          returned: params.chat.returned ?? null,
          absoluteresp: params.chat.absoluteresp ?? null,
          response: params.chat.response ?? null,
        }
      : null,
    recentConversation: context,
  }

  const messages = [
    {
      role: 'system',
      content:
        'Você é um classificador de intenção para mensagens de pacientes de uma clínica oftalmológica. ' +
        'Responda somente JSON válido. Não escreva explicações fora do JSON.',
    },
    {
      role: 'user',
      content: `Classifique se a mensagem atual deve receber uma resposta automática sobre tempo de espera/pontualidade/atraso no atendimento.

Retorne exatamente este formato JSON:
{
  "intent": "WAIT_TIME_COMPLAINT" | "PATIENT_IS_LATE" | "EVALUATION_OBSERVATION" | "SCHEDULE_REPLY" | "OTHER",
  "confidence": 0.0,
  "shouldAutoReply": false,
  "reason": "curto"
}

Marque shouldAutoReply=true somente se o paciente estiver reclamando ou perguntando claramente sobre demora no atendimento, tempo de permanência na clínica, pontualidade do atendimento ou atraso do atendimento.

Não responda automático quando:
- o paciente diz que ele mesmo está atrasado ou pergunta se pode chegar atrasado;
- o texto é uma observação dentro de avaliação de atendimento;
- a mensagem é confirmação, cancelamento, reagendamento ou nota;
- a confiança for menor que ${threshold}.

Dados:
${JSON.stringify(payload, null, 2)}`,
    },
  ]

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: String(Env.get('WAITING_TIME_INTENT_MODEL', WAITING_TIME_CLASSIFIER_DEFAULT_MODEL)),
        messages,
        temperature: 0,
        max_tokens: 180,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    )

    const content = response.data?.choices?.[0]?.message?.content || ''
    const parsed = parseClassifierJson(content)
    if (!parsed) throw new Error(`JSON inválido do classificador: ${content}`)

    const confidence = Number(parsed.confidence || 0)
    const shouldAutoReply =
      parsed.shouldAutoReply === true &&
      parsed.intent === 'WAIT_TIME_COMPLAINT' &&
      confidence >= threshold

    return {
      intent: String(parsed.intent || 'OTHER'),
      confidence,
      shouldAutoReply,
      reason: String(parsed.reason || ''),
      threshold,
    }
  } catch (error) {
    await Log.create({
      name: 'GupshupWaitingTimeClassifierError',
      message: error?.message || String(error),
      description: error?.stack || 'Erro ao classificar intenção de tempo de espera',
    })

    await notifyAiClassifierFailure({
      error,
      body: params.body,
      appName: params.appName,
      fromDigits: params.fromDigits,
      source: params.source,
      chat: params.chat,
    })

    return null
  }
}

async function shouldSendWaitingTimeResponse(params: {
  body: string
  appName: string
  fromDigits: string
  fromKey: string | null
  source: string
  chat?: any
}) {
  const classifierEnabled = envBoolean('WAITING_TIME_INTENT_CLASSIFIER_ENABLED', true)
  const fallbackToKeyword = envBoolean('WAITING_TIME_INTENT_FALLBACK_TO_KEYWORD', true)

  if (!classifierEnabled) {
    return fallbackToKeyword
  }

  const decision = await classifyWaitingTimeIntent(params)

  if (!decision) {
    return fallbackToKeyword
  }

  if (!decision.shouldAutoReply) {
    await Log.create({
      name: 'GupshupWaitingTimeClassifierBlocked',
      message: JSON.stringify({
        body: params.body,
        appName: params.appName || null,
        chat_id: params.chat?.id ?? null,
        interaction_id: params.chat?.interaction_id ?? null,
        interaction_seq: params.chat?.interaction_seq ?? null,
        decision,
      }),
      description: 'Classificador não autorizou resposta automática sobre tempo de espera',
    })
  }

  return decision.shouldAutoReply
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
    let chat: any = null

    if (body && shouldClassifyWaitingTimeIntent(body)) {
      if (inboundGsId) {
        chat = await getChatByGsId(inboundGsId)
      }

      if (!chat) {
        const evaluationChat = await getChatByPhone(fromDigits, toDigits, 2)
        chat = evaluationChat || (await getChatByPhone(fromDigits, toDigits))
      }

      const shouldAutoReply = await shouldSendWaitingTimeResponse({
        body,
        appName,
        fromDigits,
        fromKey,
        source: sourceFallback || toDigits || onlyDigits(chat?.chatnumber || ''),
        chat,
      })

      if (shouldAutoReply) {
        await saveInboundTalk(fromDigits, fromKey, sourceFallback || toDigits || onlyDigits(chat?.chatnumber || ''), body)
        await sendWaitingTimeKeywordResponse(chat, fromDigits, toDigits, sourceFallback)
        return
      }
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
