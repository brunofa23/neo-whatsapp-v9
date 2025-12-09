// app/Services/whatsapp/core/MessageRouter.ts

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

// =====================================================
// Ignore filter
// =====================================================
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
// Dedup
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
// Anti-loop
// =====================================================
const messageTracker = new Map<string, { count: number; lastMessage: number }>()

function isBotLoopDetected(jid: string): boolean {
  const now = Date.now()
  const record = messageTracker.get(jid)

  if (!record) {
    messageTracker.set(jid, { count: 1, lastMessage: now })
    return false
  }

  const diff = now - record.lastMessage
  if (diff < 5000) {
    record.count++
    record.lastMessage = now
    if (record.count >= 3) return true
  } else {
    messageTracker.set(jid, { count: 1, lastMessage: now })
  }

  return false
}

// =====================================================
// Internal agents cache
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
    .whereNull('response')
    .orderBy('created_at', 'desc')
    .first()
}

// =====================================================
// ROUTER
// =====================================================
export default class MessageRouter {
  public async handleInbound(msg: WaInboundMessage) {
    try {
      // 0) dedupe
      if (isDuplicate(msg)) return

      // 1) ignores
      if (shouldIgnoreInbound(msg)) return

      // 2) ctx
      const ctx = makeCtx(msg)

      // 3) groups
      if (msg.isGroup) return

      // 4) internal agents
      if (ctx.fromDigits && (await isInternalAgentByDigits(ctx.fromDigits))) return

      // 5) anti-loop
      if (isBotLoopDetected(ctx.fromResolvedJid)) return

      // 6) media
      if (msg.hasMedia) {
        await ctx.reply('Por favor envie apenas texto.')
        return
      }

      // 7) agent digits
      const agent = await Agent.findOrFail(msg.agentId)
      const agentDigits = onlyDigits(agent.number_phone)

      // 8) *** SERIALIZAÇÃO CRÍTICA ***
      const fromForDb = ctx.fromResolvedJid // já é sempre @c.us do provider
      console.log("SERIALIZAÇÃO &&&&&&&&&&&&&&&&>>>>>>", fromForDb)

      // 9) SAVE TALK (EARLY)
      await Talk.create({
        cellphone: fromForDb,
        chatnumber: agentDigits,
        message: (msg.body || '').slice(0, 999),
        message_ack: null,
        type: 'from',
      })

      // 10) CUSTOMCHAT
      const customChat = await getCustomChat(fromForDb, agentDigits)
      if (customChat) {
        await Customchat.create({
          chats_id: customChat.chats_id,
          reg: customChat.reg,
          cellphone: fromForDb,
          cellphoneserialized: fromForDb,
          chatnumber: agentDigits,
          returned: true,
          response: msg.body,
        })
        return
      }

      // 11) CHAT EXISTENTE
      const chat = await getChat(fromForDb, agentDigits)
      if (chat) {
        await Talk.create({
          chat_id: chat.id,
          reg: chat.reg,
          cellphone: fromForDb,
          chatnumber: agentDigits,
          message: (msg.body || '').slice(0, 999),
          message_ack: null,
          type: 'from',
        })

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

      // 12) fallback
      await ctx.reply('Recebi sua mensagem.')
    } catch (e) {
      console.error('Router ERROR', e)
      throw e
    }
  }
}
