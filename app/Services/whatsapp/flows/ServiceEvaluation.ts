import { types } from '@ioc:Adonis/Core/Helpers'
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import { DateTime } from 'luxon'
import { InboundContext } from 'App/Services/whatsapp/core/InboundContext'

async function saveTalkTo(ctx: InboundContext, chat: Chat, text: string) {
  await Talk.create({
    chat_id: (chat as any).id,
    reg: (chat as any).reg,
    cellphone: ctx.fromResolvedJid,
    chatnumber: ctx.msg.to,
    message_ack: null,
    message: (text || '').slice(0, 999),
    type: 'to',
  })
}

function parseNote(body: string): number | null {
  // mantém sua lógica do "1o" => "10" e pega número
  const normalized = String(body || '').replace('1o', '10')
  const notes = normalized.match(/\d+/g)
  if (!notes || notes.length === 0) return null

  const n = parseInt(notes[0], 10)
  if (!types.isInteger(n)) return null
  if (n < 0 || n > 10) return null

  return n
}

/**
 * ✅ Novo ServiceEvaluation:
 * - Não usa Client/Message
 * - Funciona no wwebjs e megaapi
 */
export async function ServiceEvaluation(ctx: InboundContext, chat: Chat) {
  // Bloqueia mídia (mesma regra antiga)
  if (ctx.msg.hasMedia) {
    const warn = 'Por favor não envie áudio, imagens ou vídeos, apenas digite uma nota de 0 a 10.'
    await ctx.reply(warn)
    await saveTalkTo(ctx, chat, warn)
    return
  }

  // PERGUNTA 1 - nota 0..10
  if ((chat as any).interaction_seq === 1) {
    const note = parseNote(ctx.msg.body || '')

    if (note === null) {
      const msg =
        'Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?'
      await ctx.reply(msg)
      await saveTalkTo(ctx, chat, msg)
      return
    }

    // atualiza chat como antes
    ;(chat as any).returned = true
    ;(chat as any).absoluteresp = note
    ;(chat as any).interaction_seq = 2
    ;(chat as any).closed = false
    ;(chat as any).date_return = DateTime.now()

    await chat.save()

    const ask =
      `Consegue nos dizer o que motivou a sua nota ${note}? ` +
      'Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.'
    await ctx.reply(ask)
    await saveTalkTo(ctx, chat, ask)
    return
  }

  // PERGUNTA 2 - justificativa
  if ((chat as any).interaction_seq === 2) {
    const body = String(ctx.msg.body || '').trim()

    if (body === '9') {
      const finalMsg = 'Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!'
      await ctx.reply(finalMsg)
      await saveTalkTo(ctx, chat, finalMsg)
      return
    }

    ;(chat as any).date_return = DateTime.now()
    ;(chat as any).response = body.slice(0, 599)
    ;(chat as any).closed = false

    await chat.save()

    const thanks = 'Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏'
    await ctx.reply(thanks)
    await saveTalkTo(ctx, chat, thanks)
    return
  }
}
