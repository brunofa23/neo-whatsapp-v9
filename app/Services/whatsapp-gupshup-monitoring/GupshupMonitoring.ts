// app/Services/whatsapp-gupshup-monitoring/GupshupMonitoring.ts
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'

// ✅ novos imports para o fluxo de customchat via Gupshup
import Agent from 'App/Models/Agent'
import Customchat from 'App/Models/Customchat'

// ✅ ConfirmSchedule exclusivo do Gupshup (sem whatsapp-web.js)
import ConfirmScheduleGupshup from './ConfirmScheduleGupshup'
import ServiceEvaluationGupshup from './ServiceEvaluationGupshup'

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

    // ==========================================================
    // 🔹 NOVO: checar se este app é "default_chat" em Agents
    // ==========================================================
    let defaultAgent: Agent | null = null
    if (appName) {
      defaultAgent = await Agent.query()
        .where('gupshup_src_name', appName)
        .where('default_chat', true)
        .first()
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

    await Talk.create({
      cellphone: fromDigits,
      cellphoneserialized: fromKey,
      chatnumber: toDigits,
      message: body.slice(0, 999),
      type: 'from',
    })

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
