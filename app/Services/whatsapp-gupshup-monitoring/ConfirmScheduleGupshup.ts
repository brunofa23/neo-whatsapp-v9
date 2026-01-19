// app/Services/whatsapp-gupshup-monitoring/ConfirmScheduleGupshup.ts
import Chat from 'App/Models/Chat'
import Response from 'App/Models/Response'
import Talk from 'App/Models/Talk'
import SendTextGupshup from 'App/Services/whatsapp-gupshup/SendTextGupshup'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'
import { DateTime } from 'luxon'
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

type GupshupInbound = {
  from: string // digits do paciente (ex: 5531985...)
  to: string // digits do seu WABA/source (pode vir vazio no webhook)
  body: string
  hasMedia: boolean
  context?: { gsId?: string }
}

function safeJsonParse<T = any>(v: any, fallback: T): T {
  try {
    if (v == null) return fallback
    if (typeof v === 'object') return v as T
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

function formatMessage(template: string, fields: any) {
  return String(template || '')
    .replace('{name_unit}', fields?.name_unit ?? '')
    .replace('{address_unit}', fields?.address_unit || 'Endereço indisponível')
    .replace('{address}', fields?.address || 'Endereço indisponível')
    .replace('{medic}', fields?.medic || 'Médico não informado')
    .replace('{phone_unit}', fields?.phone_unit || 'Contato indisponível')
    .replace('{schedule}', fields?.schedule ?? '')
}

function messageLink(message: string, phone_unit: string) {
  const encoded = encodeURIComponent(message || '')
  return `https://api.whatsapp.com/send?phone=${phone_unit}&text=${encoded}`
}

async function sendTextAndLog(params: {
  sourcePhone: string // seu WABA (toDigits)
  destinationPhone: string // paciente (fromDigits)
  fromDigits: string
  toDigits: string
  chatId?: number | null
  reg?: any
  text: string
}) {
  const { sourcePhone, destinationPhone, fromDigits, toDigits, chatId, reg, text } = params

  // ✅ envia texto via endpoint /msg
  await SendTextGupshup({
    source: sourcePhone,
    destination: destinationPhone,
    text,
  })


  // ✅ grava histórico de envio
  const phoneKey = normalizePhoneKey(fromDigits)
  await Talk.create({
    chat_id: chatId ?? null,
    reg: reg ?? null,
    cellphone: fromDigits,
    cellphoneserialized: phoneKey,
    chatnumber: toDigits,
    message: text.slice(0, 999),
    type: 'to',
  })
}

/**
 * ConfirmSchedule EXCLUSIVO para Gupshup (texto livre via /wa/api/v1/msg)
 * - Não usa whatsapp-web.js
 * - Recebe inbound {from,to,body,hasMedia}
 * - Usa Chat/Response/Talk + interpretAnswer
 *
 * ✅ Regra nova:
 * - Aceita apenas: confirmar/cancelar (botões) OU sim/não (digitado) OU 1/2
 * - Se vier qualquer outra coisa (texto aleatório, emoji, etc.), responde pedindo para selecionar uma opção no menu.
 */
export default async function ConfirmScheduleGupshup(inbound: GupshupInbound, chat: Chat) {
  console.log('PASSO 1 CONFIRM SCHEDULE')

  const fromDigits = String(inbound.from || '').replace(/\D/g, '')

  // ✅ IMPORTANTE: "to" pode vir vazio no webhook.
  //    Usa o inbound.to se vier; senão usa chat.chatnumber (salvo no envio).
  const toDigits =
    String(inbound.to || '').replace(/\D/g, '') ||
    String((chat as any)?.chatnumber || '').replace(/\D/g, '')

  let body = String(inbound.body || '').trim()

  // ✅ Normalização "dura" para restringir o que aceitamos
  // - Botões: "Confirmar" / "Cancelar"
  // - Digitado: "sim" / "não" / "nao"
  // - Números: 1 / 2
  //
  // A ideia é "fechar" o funil:
  // se não cair nessas opções, a gente pergunta de novo pedindo para usar o menu.
  const normalized = body.toLowerCase().replace(/\s+/g, ' ').trim()
  if (normalized === 'confirmar' || normalized === 'confirmado' || normalized === 'sim' || normalized === 's') {
    body = '1'
  } else if (
    normalized === 'cancelar' ||
    normalized === 'cancelado' ||
    normalized === 'nao' ||
    normalized === 'não' ||
    normalized === 'n' ||
    normalized === '2'
  ) {
    body = '2'
  } else if (normalized === '1') {
    body = '1'
  } else {
    // mantém o texto original para o interpretAnswer tentar (ex: "1." ou "1 " etc.)
    body = normalized
  }

  // Se vier mídia, pede texto (mantém comportamento)
  if (inbound.hasMedia) {
    const msg =
      'Por favor não envie áudio, imagens ou vídeos.\n' +
      'Use o menu e selecione uma opção:\n' +
      '*Confirmar* ou *Cancelar*.'
    await sendTextAndLog({
      sourcePhone: toDigits,
      destinationPhone: fromDigits,
      fromDigits,
      toDigits,
      chatId: chat.id,
      reg: (chat as any).reg,
      text: msg,
    })
    return
  }

  // Trabalhando “somente com esse primeiro” => seq 1
  if ((chat as any).interaction_seq !== 1) {
    return
  }

  // otherfields vem no preload shippingcampaign
  const otherfieldsRaw = (chat as any).shippingcampaign?.otherfields
  const chatOtherFields = safeJsonParse<any>(otherfieldsRaw, {})

  // interpreta resposta ("1", "confirmado", "sim", etc.)
  const answer = await interpretAnswer(body)

  // ✅ NOVO: validação principal
  // Só permite confirmar (1) ou cancelar/reagendar (2).
  // Qualquer outra coisa: pede para selecionar no menu.
  if (answer?.code !== 1 && answer?.code !== 2) {
    const msg =
      'Não consegui identificar sua resposta.\n' +
      'Por favor selecione uma opção no menu:\n' +
      '*Confirmar* ou *Cancelar*.'

    await sendTextAndLog({
      sourcePhone: toDigits,
      destinationPhone: fromDigits,
      fromDigits,
      toDigits,
      chatId: chat.id,
      reg: (chat as any).reg,
      text: msg,
    })
    return
  }

  // =========================
  // 1) CONFIRMOU
  // =========================
  if (answer?.code === 1) {
    const response1schedule = await Response.query()
      .select('message')
      .where('local', 'response1schedule')
      .andWhere('inactive', false)
      .first()

    const defaultMessage =
      `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields?.address}. ` +
      `Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chatOtherFields?.phone_unit}.`

    const responseText = response1schedule?.message
      ? formatMessage(response1schedule.message, chatOtherFields)
      : defaultMessage

    await sendTextAndLog({
      sourcePhone: toDigits,
      destinationPhone: fromDigits,
      fromDigits,
      toDigits,
      chatId: chat.id,
      reg: (chat as any).reg,
      text: responseText,
    })

    Object.assign(chat, {
      response: body.slice(0, 500), // aqui ficará "1" se veio do botão Confirmar / "sim"
      returned: true,
      absoluteresp: 1,
      externalstatus: 'A',
      company_id: (chat as any).shippingcampaign?.company_id,
      date_return: DateTime.now().toFormat('yyyy-MM-dd HH:mm'),
    })

    await chat.save()
    return
  }

  // =========================
  // 2) CANCELAR / REAGENDAR
  // =========================
  if (answer?.code === 2) {
    Object.assign(chat, {
      response: body.slice(0, 500), // aqui ficará "2" se veio do botão Cancelar / "não"
      absoluteresp: 2,
      externalstatus: 'A',
      company_id: (chat as any).shippingcampaign?.company_id,
      date_return: DateTime.now().toFormat('yyyy-MM-dd HH:mm'),
    })
    await chat.save()

    const response2schedule = await Response.query()
      .select('message')
      .where('local', 'response2schedule')
      .andWhere('inactive', false)
      .first()

    const default2Message =
      `Entendi 😉, sabemos que nosso dia está muito atarefado! Sua consulta foi desmarcada, ` +
      `se deseja reagendar, clique no link que estou enviando para conversar com uma de nossas atendentes e podermos agendar novo horário mais conveniente para você.`

    const msg2 = response2schedule?.message
      ? formatMessage(response2schedule.message, chatOtherFields)
      : default2Message

    await sendTextAndLog({
      sourcePhone: toDigits,
      destinationPhone: fromDigits,
      fromDigits,
      toDigits,
      chatId: chat.id,
      reg: (chat as any).reg,
      text: msg2,
    })

    const response2schedule2 = await Response.query().where('local', 'response2schedule2').first()

    if (response2schedule2 && response2schedule2.inactive === false) {
      const linkRedirect = messageLink(response2schedule2.message, chatOtherFields?.phone_unit)
      await sendTextAndLog({
        sourcePhone: toDigits,
        destinationPhone: fromDigits,
        fromDigits,
        toDigits,
        chatId: chat.id,
        reg: (chat as any).reg,
        text: linkRedirect,
      })
    } else {
      const msgLink = `Olá, sou ${(chat as any).name} e gostaria de reagendar uma consulta com ${chatOtherFields?.medic}.`
      const phoneUnit = chatOtherFields?.phone_unit || (chat as any).shippingcampaign?.phone_unit
      const linkRedirect = messageLink(msgLink, phoneUnit)
      await sendTextAndLog({
        sourcePhone: toDigits,
        destinationPhone: fromDigits,
        fromDigits,
        toDigits,
        chatId: chat.id,
        reg: (chat as any).reg,
        text: linkRedirect,
      })
    }

    // (Opcional, igual seu original) cria novo Chat seq=2 marcando reagendamento
    const chat2 = new Chat()
    Object.assign(chat2, {
      interaction_id: (chat as any).interaction_id,
      interaction_seq: 2,
      idexternal: (chat as any).idexternal,
      reg: (chat as any).reg,
      name: (chat as any).name,
      cellphone: (chat as any).cellphone,
      cellphoneserialized: fromDigits,
      shippingcampaigns_id: (chat as any).shippingcampaigns_id,
      message: msg2.slice(0, 348),
      response: 'Reagendada',
      returned: true,
      company_id: (chat as any).shippingcampaign?.company_id,
    })
    await Chat.create(chat2)

    return
  }
}
