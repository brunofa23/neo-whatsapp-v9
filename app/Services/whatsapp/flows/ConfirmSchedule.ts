import Chat from 'App/Models/Chat'
import Response from 'App/Models/Response'
import Talk from 'App/Models/Talk'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'
import { InboundContext } from 'App/Services/whatsapp/core/InboundContext'

type AnyFields = Record<string, any>

function formatMessage(template: string, fields: AnyFields) {
  return String(template ?? '')
    .replace('{name_unit}', fields.name_unit ?? '')
    .replace('{address_unit}', fields.address_unit || 'Endereço indisponível')
    .replace('{address}', fields.address || 'Endereço indisponível')
    .replace('{medic}', fields.medic || 'Médico não informado')
    .replace('{phone_unit}', fields.phone_unit || 'Contato indisponível')
    .replace('{schedule}', fields.schedule ?? '')
}

function buildWhatsappRedirectLink(text: string, phoneUnit: string) {
  const encoded = encodeURIComponent(text)
  return `https://api.whatsapp.com/send?phone=${phoneUnit}&text=${encoded}`
}

async function saveTalkTo(ctx: InboundContext, text: string, chatId?: number, reg?: any) {
  await Talk.create({
    chat_id: chatId ?? undefined,
    reg: reg ?? undefined,
    cellphone: ctx.fromResolvedJid,      // quem enviou
    chatnumber: ctx.msg.to,              // número do agent/instância
    message_ack: null,
    message: (text || '').slice(0, 999),
    type: 'to',
  })
}

/**
 * ✅ Novo ConfirmSchedule:
 * - Não usa Client/Message
 * - Funciona para wwebjs e megaapi
 * - Responde via ctx.reply()
 */
export async function ConfirmSchedule(ctx: InboundContext, chat: Chat) {
  // Se por algum motivo vier mídia aqui, mantém a regra
  if (ctx.msg.hasMedia) {
    const warn =
      'Por favor não envie áudio, imagens ou vídeos, apenas digite \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.'
    await ctx.reply(warn)
    await saveTalkTo(ctx, warn, (chat as any).id, (chat as any).reg)
    return
  }

  // Seu fluxo só roda quando interaction_seq == 1 (mesmo comportamento antigo)
  if ((chat as any).interaction_seq !== 1) return

  // shippingcampaign.otherfields
  let chatOtherFields: AnyFields = {}
  try {
    const raw = (chat as any).shippingcampaign?.otherfields
    chatOtherFields = raw ? JSON.parse(raw) : {}
  } catch {
    chatOtherFields = {}
  }

  const answer = await interpretAnswer(ctx.msg.body || '')

  // ==========================
  // CODE 1: confirmou presença
  // ==========================
  if (answer?.code === 1) {
    try {
      const response1schedule = await Response.query()
        .select('message')
        .where('local', 'response1schedule')
        .andWhere('inactive', false)
        .first()

      const defaultMessage =
        `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields.address}. ` +
        `Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chatOtherFields.phone_unit}.`

      const response1message = response1schedule
        ? formatMessage((response1schedule as any).message, chatOtherFields)
        : defaultMessage

      await ctx.reply(response1message)
      await saveTalkTo(ctx, response1message, (chat as any).id, (chat as any).reg)

      Object.assign(chat, {
        response: (ctx.msg.body || '').slice(0, 500),
        returned: true,
        absoluteresp: 1,
        externalstatus: 'A',
        company_id: (chat as any).shippingcampaign?.company_id,
      })

      console.log("CHAT$$$$$$$$$$$$$$$$$%%%%>>", chat)


      await chat.save()
    } catch (error: any) {
      console.error('Erro ao enviar a mensagem de agendamento:', error?.message, error?.stack)
    }

    return
  }

  // ==========================================
  // CODE 2: reagendamento / cancelamento
  // ==========================================
  if (answer?.code === 2) {
    try {
      Object.assign(chat, {
        response: ctx.msg.body,
        absoluteresp: 2,
        externalstatus: 'A',
        company_id: (chat as any).shippingcampaign?.company_id,
      })
      await chat.save()
    } catch (error) {
      console.log('Erro 121:', error)
    }

    try {
      const response2schedule = await Response.query()
        .select('message')
        .where('local', 'response2schedule')
        .andWhere('inactive', false)
        .first()

      const default2Message =
        'Entendi 😉, sabemos que nosso dia está muito atarefado! Sua consulta foi desmarcada, ' +
        'se deseja reagendar, clique no link que estou enviando para conversar com uma de nossas atendentes e ' +
        'podermos agendar novo horário mais conveniente para você.'

      const message2 = response2schedule
        ? formatMessage((response2schedule as any).message, chatOtherFields)
        : default2Message

      await ctx.reply(message2)
      await saveTalkTo(ctx, message2, (chat as any).id, (chat as any).reg)

      // 2ª mensagem com link (se existir e estiver ativa)
      const response2schedule2 = await Response.query()
        .where('local', 'response2schedule2')
        .first()

      if (response2schedule2 && (response2schedule2 as any).inactive === false) {
        const linkRedirect = buildWhatsappRedirectLink(
          (response2schedule2 as any).message,
          chatOtherFields.phone_unit
        )
        await ctx.reply(linkRedirect)
        await saveTalkTo(ctx, linkRedirect, (chat as any).id, (chat as any).reg)
      } else {
        // fallback padrão Neo
        const msgLink = `Olá, sou ${(chat as any).name} e gostaria de reagendar uma consulta com ${chatOtherFields.medic}.`
        const linkRedirect = buildWhatsappRedirectLink(
          msgLink,
          (chat as any).shippingcampaign?.phone_unit || chatOtherFields.phone_unit
        )

        await ctx.reply(linkRedirect)
        await saveTalkTo(ctx, linkRedirect, (chat as any).id, (chat as any).reg)
      }

      // cria um novo chat (igual seu código)
      const chat2 = new Chat()
      Object.assign(chat2, {
        interaction_id: (chat as any).interaction_id,
        interaction_seq: 2,
        idexternal: (chat as any).idexternal,
        reg: (chat as any).reg,
        name: (chat as any).name,
        cellphone: (chat as any).cellphone,
        cellphoneserialized: ctx.fromResolvedJid,
        shippingcampaigns_id: (chat as any).shippingcampaigns_id,
        message: String(message2 || '').slice(0, 348),
        response: 'Reagendada',
        returned: true,
        company_id: (chat as any).shippingcampaign?.company_id,
      })

      await Chat.create(chat2)
    } catch (error) {
      console.log('Erro:', error)
    }

    return
  }

  // ==========================
  // CODE 3: cadastro incorreto
  // ==========================
  if (answer?.code === 3) {
    try {
      const defaultMessage = 'Desculpe pelo engano, vou pedir para corrigir nosso cadastro.'
      await ctx.reply(defaultMessage)
      await saveTalkTo(ctx, defaultMessage, (chat as any).id, (chat as any).reg)
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error?.message, error?.stack)
    }
    return
  }

  // ==========================
  // fallback: não entendeu
  // ==========================
  const fallback =
    'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.'
  await ctx.reply(fallback)
  await saveTalkTo(ctx, fallback, (chat as any).id, (chat as any).reg)
}
