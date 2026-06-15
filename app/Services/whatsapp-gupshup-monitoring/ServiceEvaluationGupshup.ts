import { types } from '@ioc:Adonis/Core/Helpers'
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'
import SendTextGupshup from 'App/Services/whatsapp-gupshup/SendTextGupshup'
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

type InboundGupshup = {
  from: string
  to?: string
  body: string
  hasMedia: boolean
  context?: { gsId?: string }
  raw?: any
}

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

/**
 * Envia texto via Gupshup usando sua função SendTextGupshup({source,destination,text})
 * - source: número do WABA (o número do agente/origem)
 * - destination: número do paciente (fromDigits)
 */
async function sendText(source: string, destination: string, text: string) {
  const src = onlyDigits(source)
  const dst = onlyDigits(destination)

  if (!src || !dst) {
    throw new Error(
      `SendTextGupshup inválido: source="${String(source)}" destination="${String(destination)}"`
    )
  }

  return SendTextGupshup({ source: src, destination: dst, text })
}

export default async function ServiceEvaluationGupshup(inbound: InboundGupshup, chat: Chat) {
  const fromDigits = onlyDigits(inbound?.from) // paciente
  const toDigits = onlyDigits(inbound?.to)     // às vezes vem vazio no inbound
  const body = String(inbound?.body || '')
  const hasMedia = !!inbound?.hasMedia

  // ✅ chave de correlação (mesma usada no Chat.cellphoneserialized)
  const cellphoneserialized = normalizePhoneKey(fromDigits)

  // ✅ define o source do envio (WABA)
  // 1) chat.chatnumber (normalmente você grava o número WABA aí quando envia)
  // 2) inbound.to (quando vier)
  const source = onlyDigits((chat as any)?.chatnumber || '') || toDigits
  try {
    // Se não tiver source, não tem como responder pelo Gupshup
    if (!source) {
      // await Log.create({
      //   name: 'ServiceEvaluationGupshupNoSource',
      //   message: JSON.stringify({
      //     at: DateTime.now().toISO(),
      //     chat_id: (chat as any)?.id,
      //     from: fromDigits,
      //     inbound_to: toDigits || null,
      //     chatnumber: (chat as any)?.chatnumber || null,
      //     cellphoneserialized: cellphoneserialized || null,
      //     note: 'Não foi possível enviar resposta: source (WABA) ausente',
      //   }),
      //   description: 'Sem source (WABA) para enviar via Gupshup',
      // })
      return
    }

    // 0) bloqueia mídia
    if (hasMedia) {
      const text = 'Por favor não envie áudio, imagens ou vídeos, apenas digite uma nota de 0 a 10.'
      await sendText(source, fromDigits, text)

      await Talk.create({
        chat_id: (chat as any).id,
        reg: (chat as any).reg,
        cellphone: fromDigits,
        cellphoneserialized: cellphoneserialized || null,
        chatnumber: source,
        message_ack: 0,
        message: text,
        type: 'to',
      } as any)

      return
    }

    // ==========================================================
    // PERGUNTA 1 - AVALIAÇÃO (nota 0 a 10)
    // ==========================================================
    if ((chat as any).interaction_seq == 1) {
      const notes = body.replace('1o', '10').match(/\d+/g)

      let invalidNote = false
      let invalidNoteNegative = false

      if (notes) {
        invalidNote = notes.some((note) => parseInt(note) > 10)
        invalidNoteNegative = notes.some((note) => parseInt(note) < 0)
      }

      if (!notes || notes.length === 0 || invalidNote || invalidNoteNegative) {
        const text =
          'Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?'

        await sendText(source, fromDigits, text)

        await Talk.create({
          chat_id: (chat as any).id,
          reg: (chat as any).reg,
          cellphone: fromDigits,
          cellphoneserialized: cellphoneserialized || null,
          chatnumber: source,
          message_ack: 0,
          message: text,
          type: 'to',
        } as any)

        return
      }

      const note = parseInt(notes[0])

      if (types.isInteger(note)) {
        ;(chat as any).returned = true
        ;(chat as any).absoluteresp = note
        ;(chat as any).interaction_seq = 2
        ;(chat as any).closed = false
        ;(chat as any).date_return = DateTime.now()
        await chat.save()

        const text = `Consegue nos dizer o que motivou a sua nota ${note}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`
        await sendText(source, fromDigits, text)

        await Talk.create({
          chat_id: (chat as any).id,
          reg: (chat as any).reg,
          cellphone: fromDigits,
          cellphoneserialized: cellphoneserialized || null,
          chatnumber: source,
          message_ack: 0,
          message: text,
          type: 'to',
        } as any)

        return
      }

      // fallback (não esperado)
      const text =
        'Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?'
      await sendText(source, fromDigits, text)

      await Talk.create({
        chat_id: (chat as any).id,
        reg: (chat as any).reg,
        cellphone: fromDigits,
        cellphoneserialized: cellphoneserialized || null,
        chatnumber: source,
        message_ack: 0,
        message: text,
        type: 'to',
      } as any)

      return
    }

    // ==========================================================
    // PERGUNTA 2 - MOTIVO (ou "9" finaliza)
    // ==========================================================
    if ((chat as any).interaction_seq == 2) {
      console.log('PASSO 2.1 5555')
      const isExcellentEvaluation =
        Number((chat as any).absoluteresp) === 9 || Number((chat as any).absoluteresp) === 10
      const patientName = String((chat as any).name || '').trim() || 'paciente'
      const googleReviewText = `Olá ${patientName}, 

Obrigado pela sua nota excelente ao nos avaliar! Ficamos muito felizes com sua satisfação.

Como valorizamos seu feedback, gostaríamos de pedir um favor: poderia compartilhar sua experiência no Google? Sua avaliação ajuda outros pacientes a conhecerem nosso atendimento.

Aqui está o link: https://g.page/r/Cen7HWNEOsLKEAE/review

Muito obrigado pela colaboração!

NEO - Núcleo de Excelência em Oftalmologia`

      if (body.trim() === '9') {
        const text = 'Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!'
        await sendText(source, fromDigits, text)

        await Talk.create({
          chat_id: (chat as any).id,
          reg: (chat as any).reg,
          cellphone: fromDigits,
          cellphoneserialized: cellphoneserialized || null,
          chatnumber: source,
          message_ack: 0,
          message: text,
          type: 'to',
        } as any)

        if (isExcellentEvaluation) {
          await sendText(source, fromDigits, googleReviewText)

          await Talk.create({
            chat_id: (chat as any).id,
            reg: (chat as any).reg,
            cellphone: fromDigits,
            cellphoneserialized: cellphoneserialized || null,
            chatnumber: source,
            message_ack: 0,
            message: googleReviewText,
            type: 'to',
          } as any)
        }

        return
      }

      ;(chat as any).date_return = DateTime.now()
      ;(chat as any).response = body.slice(0, 599)
      ;(chat as any).closed = false
      await chat.save()

      console.log('PASSO 2.2', body)

      const text = 'Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏'
      await sendText(source, fromDigits, text)

      await Talk.create({
        chat_id: (chat as any).id,
        reg: (chat as any).reg,
        cellphone: fromDigits,
        cellphoneserialized: cellphoneserialized || null,
        chatnumber: source,
        message_ack: 0,
        message: text,
        type: 'to',
      } as any)

      if (isExcellentEvaluation) {
        await sendText(source, fromDigits, googleReviewText)

        await Talk.create({
          chat_id: (chat as any).id,
          reg: (chat as any).reg,
          cellphone: fromDigits,
          cellphoneserialized: cellphoneserialized || null,
          chatnumber: source,
          message_ack: 0,
          message: googleReviewText,
          type: 'to',
        } as any)
      }

      return
    }
  } catch (error) {
    await Log.create({
      name: 'ServiceEvaluationGupshupError',
      message: error?.message || String(error),
      description: error?.stack || 'Sem stack',
    })
  }
}
