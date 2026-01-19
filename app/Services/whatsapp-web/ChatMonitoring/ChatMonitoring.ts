import Chat from 'App/Models/Chat'
import Response from 'App/Models/Response'
import Customchat from 'App/Models/Customchat'
import { Client, Message } from 'whatsapp-web.js'
import MidiasController from 'App/Controllers/Http/MidiasController'
import { RandomResponse, stateTyping } from '../util'
import ConfirmSchedule from './ConfirmSchedule'
import ServiceEvaluation from './ServiceEvaluation'

import Agent from 'App/Models/Agent'
import { DateTime } from 'luxon'
import { responderPergunta } from 'App/Services/Ai/aiResponder'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'

// =======================
// Anti-loop simples (mantido)
// =======================
const messageTracker = new Map<string, { count: number; lastMessage: number }>()
function isBotLoopDetected(phone: string): boolean {
  const now = Date.now()
  const record = messageTracker.get(phone)

  if (!record) {
    messageTracker.set(phone, { count: 1, lastMessage: now })
    return false
  }

  const diff = now - record.lastMessage
  if (diff < 5000) {
    record.count++
    record.lastMessage = now
    if (record.count >= 3) {
      console.warn(`Possível loop de bot detectado com ${phone}. Ignorando temporariamente.`)
      return true
    }
  } else {
    messageTracker.set(phone, { count: 1, lastMessage: now })
  }

  return false
}

// =======================
// Cache de agentes internos (PASSO 2 com performance)
// =======================
const INTERNAL_CACHE_TTL_MS = 5 * 60 * 1000 // 5 min
let internalDigitsCache = new Set<string>()
let internalCacheAt = 0
let refreshPromise: Promise<void> | null = null

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

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

// =======================
// DB helpers (mantidos)
// =======================
async function getCustomChat(cellphone: string, chatnumber: string) {
  chatnumber = chatnumber.replace(/@.*$/, '')
  return await Customchat.query()
    .where('cellphoneserialized', cellphone)
    .andWhere('chatnumber', chatnumber)
    .andWhereNull('returned')
    .orderBy('created_at', 'desc')
    .first()
}

async function getChat(cellphone: string, agentPhone: string) {
  const match = agentPhone.match(/\d/g)
  const phoneAgent = match ? match.join('') : ''

  return await Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', cellphone)
    .andWhere('chatnumber', phoneAgent)
    .orderBy('created_at', 'desc')
    .whereNull('response')
    .first()
}

// =======================
// Resolver JID -> phone (c.us) quando vier lid
// =======================
async function resolveJid(client: Client, jid: string) {
  if (!jid) return { jid, phoneJid: null as string | null, phoneDigits: '' }

  if (jid.endsWith('@c.us')) {
    return { jid, phoneJid: jid, phoneDigits: onlyDigits(jid) }
  }

  if (jid.endsWith('@lid')) {
    try {
      const result = await (client as any).getContactLidAndPhone([jid])
      const item = result?.[0]
      const pn: string | null = item?.pn || null // ex: 5531...@c.us
      return { jid, phoneJid: pn, phoneDigits: onlyDigits(pn) }
    } catch {
      return { jid, phoneJid: null, phoneDigits: '' }
    }
  }

  return { jid, phoneJid: null, phoneDigits: onlyDigits(jid) }
}

// =======================
// Ignore filter (mantido)
// =======================
function shouldIgnoreMessage(message: Message): boolean {
  const from = message.from ?? ''
  return (
    (message as any).fromMe === true || // evita responder mensagens enviadas pelo próprio bot
    message.type?.toLowerCase() === 'e2e_notification' ||
    (message.body === '' && !message.hasMedia) ||
    from.includes('@broadcast') ||
    from.includes('@status')
  )
}

// =======================
// Monitoring
// =======================
export default class Monitoring {
  async monitoring(client: Client) {
    try {
      client.on('message', async (message) => {
        // 0) ignora mensagens que não interessam
        if (shouldIgnoreMessage(message)) return

        // 1) resolve remetente (DM) e autor (grupo) quando necessário
        const isGroup = message.from?.endsWith('@g.us')
        const resolvedFrom = await resolveJid(client, message.from)
        const fromResolved = resolvedFrom.phoneJid || message.from

        // Para grupos: quem escreveu é message.author
        const resolvedAuthor = isGroup && message.author ? await resolveJid(client, message.author) : null
        const senderDigits = isGroup
          ? (resolvedAuthor?.phoneDigits || onlyDigits(message.author))
          : onlyDigits(fromResolved)

        // ✅ PASSO 2: se veio de um agent interno, ignora (corta loop de vez)
        if (senderDigits && (await isInternalAgentByDigits(senderDigits))) {
          console.log(`Ignorando mensagem interna (agent) => ${senderDigits}`)
          return
        }

        // ✅ Comando simples para pegar ID do grupo
        // manda "idgroup" no grupo e ele responde no privado com o @g.us
        if (isGroup) {
          const body = (message.body || '').trim().toLowerCase()
          if (body.includes('idgroup')) {
            const groupId = message.from
            const toReply = resolvedAuthor?.phoneJid || message.author || fromResolved
            if (toReply) {
              await stateTyping(message)
              await client.sendMessage(toReply, `ID do grupo: ${groupId}`)
            }
          }
          return
        }

        // 🚫 loop detector por contato (usa fromResolved como chave)
        if (isBotLoopDetected(fromResolved)) {
          console.log(`Loop detectado de ${fromResolved}, ignorando resposta.`)
          return
        }

        // 🚫 mídia
        if (message.hasMedia) {
          await stateTyping(message)
          await client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!')
          return
        }

        // CustomChat
        const customChat = await getCustomChat(fromResolved, client.info.wid.user)
        if (customChat) {
          await handleCustomChatMessage(message, customChat, fromResolved)
          return
        }

        // Chat existente
        const chat = await getChat(fromResolved, message.to)

        await Log.create({
          name: 'fromResolved',
          message: JSON.stringify({
            fromOriginal: message.from,
            fromResolved,
            to: message.to,
            isGroup,
            chatFound: !!chat,
            chatId: chat?.id ?? null,
          }),
          description: 'RESOLVENDO CODIGO PARA NUMERO',
        })

        if (chat) {
          await handleChatMessage(client, message, chat, fromResolved)
          return
        }

        await handleNewMessage(client, message, fromResolved)
      })
    } catch (error) {
      console.error('Erro no monitoramento:', error)
    }
  }
}

// =======================
// Handlers (mantidos)
// =======================
async function handleCustomChatMessage(message: Message, customChat: any, fromResolved: string) {
  let pathMedia: string | undefined = ''
  if (message.hasMedia) {
    const media = await message.downloadMedia()
    const midias = new MidiasController()
    const fileName = `${customChat.chats_id}_${Date.now()}`
    pathMedia = await midias.storeMedia(media, fileName, 'Customchats')
    message.body = ' '
  }

  const bodyResponse = {
    chats_id: customChat.chats_id,
    reg: customChat.reg,
    cellphone: customChat.cellphone,
    cellphoneserialized: customChat.cellphoneserialized,
    chatnumber: customChat.chatnumber,
    returned: true,
    viewed: false,
    response: message.body,
    path_media: pathMedia,
  }

  await Customchat.create(bodyResponse)
  await Chat.query()
    .where('id', customChat.chats_id)
    .update({ date_return: DateTime.now().toFormat('yyyy-MM-dd HH:mm'), last_response: 2 })

  await Talk.create({
    chat_id: customChat.chats_id,
    reg: customChat.reg,
    cellphone: fromResolved,
    chatnumber: message.to,
    message_ack: message.ack,
    message: message.body.slice(0, 999),
    type: 'from',
  })
}

async function handleChatMessage(client: Client, message: Message, chat: any, fromResolved: string) {
  await Talk.create({
    chat_id: chat.id,
    reg: chat.reg,
    cellphone: fromResolved,
    chatnumber: message.to,
    message_ack: message.ack,
    message: message.body.slice(0, 999),
    type: 'from',
  })

  if (!chat.returned) {
    chat.invalidresponse = message.body.slice(0, 348)
    chat.returned = true
    await chat.save()
  }

  global.contSend--

  if (chat.interaction_id === 1) {
    await ConfirmSchedule(client, message, chat)
  } else if (chat.interaction_id === 2) {
    await ServiceEvaluation(client, message, chat)
  }
}

async function handleNewMessage(client: Client, message: Message, fromResolved: string) {
  try {
    await Talk.create({
      cellphone: fromResolved,
      chatnumber: message.to,
      message_ack: message.ack,
      message: message.body.slice(0, 999),
      type: 'from',
    })

    const query = await Shippingcampaign.query()
      .where('cellphoneserialized', fromResolved)
      .where('interaction_id', 1)
      .select('otherfields', 'name')

    const queryTalk = await Talk.query()
      .where('cellphone', fromResolved)
      .andWhere('chatnumber', message.to)

    const context = query.map((item) => `name:${item.name} \n${item.otherfields}`).join('\n')
    const contextTalk = queryTalk.map((item) => item.message).join('\n')
    const fullContext = context + '\n\n' + contextTalk

    const response = await responderPergunta(message.body, fullContext)

    if (response) {
      await stateTyping(message)
      await client.sendMessage(message.from, response)

      await Talk.create({
        cellphone: fromResolved,
        chatnumber: message.to,
        message_ack: message.ack,
        message: response.slice(0, 999),
        type: 'to',
      })
    } else {
      await sendRandomFinalMessage(client, message)
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error)
    await client.sendMessage(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem.')
  }
}

async function sendRandomFinalMessage(client: Client, message: Message) {
  let responseArray: string[]

  const responsesChatfinish = await Response.query().select('message').where('local', 'chatfinish')

  if (responsesChatfinish.length > 0) responseArray = responsesChatfinish.map((r) => r.message)
  else
    responseArray = [
      'Desculpe, mas esta conversa já foi finalizada. O Neo Agradece por sua compreensão, para maiores esclarecimentos ligue para 31-32350003.',
      'Infelizmente esta conversa já foi finalizada. O Neo Agradece por sua interação! Maiores esclarecimentos ligue para 31-32350003.',
      'Olá, sou apenas uma atendente virtual, para maiores esclarecimentos ligue para 31-32350003.',
      'Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi finalizada. Para maiores esclarecimentos ligue para 31-32350003. O Neo Agradece!',
    ]

  const randomMessage = await RandomResponse(responseArray as any)
  await stateTyping(message)
  await client.sendMessage(message.from, randomMessage)
}
