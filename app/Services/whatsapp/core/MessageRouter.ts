import { WaInboundMessage } from './IWhatsAppProvider'
import { makeCtx } from './InboundContext'

import Chat from 'App/Models/Chat'
import Customchat from 'App/Models/Customchat'
import Talk from 'App/Models/Talk'
import Agent from 'App/Models/Agent'
import Log from 'App/Models/Log'

import { ConfirmSchedule } from '../flows/ConfirmSchedule'
import { ServiceEvaluation } from '../flows/ServiceEvaluation'

// =====================================================
// Helpers
// =====================================================
function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

/**
 * Ignora mensagens que não interessam
 */
function shouldIgnoreInbound(msg: WaInboundMessage): boolean {
  const from = msg.from ?? ''
  const raw: any = msg.raw

  const fromMe = raw?.fromMe === true
  const type = String(raw?.type ?? '').toLowerCase()

  return (
    fromMe ||
    type === 'e2e_notification' ||
    (msg.body === '' && !msg.hasMedia) ||
    from.includes('@broadcast') ||
    from.includes('@status')
  )
}

// =====================================================
// Dedup (evita processar mesma mensagem 2x)
// =====================================================
const DEDUPE_TTL_MS = 2 * 60 * 1000
const seenMessages = new Map<string, number>()

function isDuplicate(msg: WaInboundMessage) {
  const key = `${msg.provider}:${msg.agentId}:${msg.messageId}`
  const now = Date.now()
  const last = seenMessages.get(key)

  if (seenMessages.size > 5000) {
    for (const [k, t] of seenMessages) {
      if (now - t > DEDUPE_TTL_MS) seenMessages.delete(k)
    }
  }

  if (last && now - last < DEDUPE_TTL_MS) return true
  seenMessages.set(key, now)
  return false
}

// =====================================================
// Anti-loop simples
// =====================================================
const messageTracker = new Map<string, { count: number; lastMessage: number }>()
function isBotLoopDetected(key: string): boolean {
  const now = Date.now()
  const record = messageTracker.get(key)

  if (!record) {
    messageTracker.set(key, { count: 1, lastMessage: now })
    return false
  }

  const diff = now - record.lastMessage
  if (diff < 5000) {
    record.count++
    record.lastMessage = now
    if (record.count >= 3) return true
  } else {
    messageTracker.set(key, { count: 1, lastMessage: now })
  }

  return false
}

// =====================================================
// Cache de agentes internos
// =====================================================
const INTERNAL_CACHE_TTL_MS = 5 * 60 * 1000
let internalDigitsCache = new Set<string>()
let internalCacheAt = 0
let refreshPromise: Promise<void> | null = null

async function refreshInternalAgentsCache(force = false) {
  const now = Date.now()
  if (!force && internalDigitsCache.size > 0 && now - internalCacheAt < INTERNAL_CACHE_TTL_MS) return
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const agents = await Agent.query()
        .select(['number_phone'])
        .where('active', true)
        .where((q) => q.whereNull('deleted').orWhere('deleted', false))
        .whereNotNull('number_phone')

      const set = new Set<string>()
      for (const a of agents) {
        const digits = onlyDigits((a as any).number_phone)
        if (digits) set.add(digits)
      }

      internalDigitsCache = set
      internalCacheAt = now
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function isInternalAgentByDigits(phoneDigits: string) {
  if (!phoneDigits) return false
  await refreshInternalAgentsCache(false)
  return internalDigitsCache.has(phoneDigits)
}

// =====================================================
// DB helpers
// =====================================================
async function getCustomChat(cellphoneJid: string, agentPhoneDigits: string) {
  return await Customchat.query()
    .where('cellphoneserialized', cellphoneJid)
    .andWhere('chatnumber', agentPhoneDigits)
    .andWhereNull('returned')
    .orderBy('created_at', 'desc')
    .first()
}

async function getChat(cellphoneJid: string, agentPhoneDigits: string) {
  return await Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', cellphoneJid)
    .andWhere('chatnumber', agentPhoneDigits)
    .orderBy('created_at', 'desc')
    .whereNull('response')
    .first()
}

// =====================================================
// Router
// =====================================================
export default class MessageRouter {
  public async handleInbound(msg: WaInboundMessage) {
    // 0) dedupe (principalmente p/ webhook megaapi)
    if (isDuplicate(msg)) return

    // 1) ignorados
    if (shouldIgnoreInbound(msg)) return

    const ctx = makeCtx(msg)

    // 2) grupos: por enquanto encerra
    if (msg.isGroup) {
      const body = (msg.body || '').trim().toLowerCase()
      if (body.includes('idgroup')) {
        await ctx.reply(`ID do grupo: ${msg.from}`)
      }
      return
    }

    // 3) ignora mensagens internas (agents)
    if (ctx.fromDigits && (await isInternalAgentByDigits(ctx.fromDigits))) return

    // 4) anti-loop por contato
    if (isBotLoopDetected(ctx.fromResolvedJid)) return

    // 5) mídia
    if (msg.hasMedia) {
      await ctx.reply('Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!')
      return
    }

    // 6) número do agent (substitui client.info.wid.user)
    const agent = await Agent.findOrFail(msg.agentId)
    const agentDigits = onlyDigits(agent.number_phone) || onlyDigits(msg.to)

    if (!agentDigits) {
      await ctx.reply('Não consegui identificar o número do atendente. Tente novamente em instantes.')
      return
    }

    // ✅ 6.1) NORMALIZA o "from" para bater com o DB (sempre @c.us)
    // Seu banco salva: 5531...@c.us
    // Se vier @lid e não conseguir resolver, cai no fallback: `${digits}@c.us`
    const fromForDb =
      ctx.fromResolvedJid?.endsWith('@c.us')
        ? ctx.fromResolvedJid
        : (ctx.fromDigits ? `${ctx.fromDigits}@c.us` : ctx.fromResolvedJid)

    // Log útil (igual você fazia)
    try {
      await Log.create({
        name: 'InboundRouter',
        message: JSON.stringify({
          provider: msg.provider,
          agentId: msg.agentId,
          from: msg.from,
          fromResolvedJid: ctx.fromResolvedJid,
          fromDigits: ctx.fromDigits,
          fromForDb,
          to: msg.to,
          agentDigits,
          messageId: msg.messageId,
        }),
        description: 'MessageRouter inbound',
      })
    } catch {}

    // 7) CustomChat (✅ usando fromForDb)
    const customChat = await getCustomChat(fromForDb, agentDigits)
    if (customChat) {
      await Customchat.create({
        chats_id: customChat.chats_id,
        reg: customChat.reg,
        cellphone: customChat.cellphone,
        cellphoneserialized: customChat.cellphoneserialized,
        chatnumber: customChat.chatnumber,
        returned: true,
        viewed: false,
        response: msg.body,
        path_media: '',
      })

      await Talk.create({
        chat_id: customChat.chats_id,
        reg: customChat.reg,
        cellphone: fromForDb, // ✅ grava no padrão do DB
        chatnumber: msg.to,
        message_ack: null,
        message: (msg.body || '').slice(0, 999),
        type: 'from',
      })

      return
    }

    // 8) Chat existente (✅ usando fromForDb)
    const chat = await getChat(fromForDb, agentDigits)
    if (chat) {
      await Talk.create({
        chat_id: chat.id,
        reg: chat.reg,
        cellphone: fromForDb, // ✅ grava no padrão do DB
        chatnumber: msg.to,
        message_ack: null,
        message: (msg.body || '').slice(0, 999),
        type: 'from',
      })

      // ✅ dispatch por interaction_id
      if (chat.interaction_id === 1) {
        await ConfirmSchedule(ctx, chat)
        return
      }

      if (chat.interaction_id === 2) {
        await ServiceEvaluation(ctx, chat)
        return
      }

      await ctx.reply('Interação não reconhecida.')
      return
    }

    // 9) Sem chat: por enquanto
    await ctx.reply('Recebi sua mensagem. (fluxo novo ainda não implementado aqui)')
  }
}
