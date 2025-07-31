import { types } from '@ioc:Adonis/Core/Helpers'
import Chat from 'App/Models/Chat';
import { Client, Message } from 'whatsapp-web.js';
<<<<<<< HEAD
import { stateTyping, extractCellphone } from '../util'
import { DateTime } from 'luxon';
import Talk from 'App/Models/Talk';

export default async (client: Client, message: Message, chat: Chat) => {
  if (message.hasMedia) {
    await stateTyping(message)
    client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos, apenas digite uma nota de 0 a 10.')
    return
  }

  //PERGUNTA 1 - AVALIAÇÃO DE ATENDIMENTO
  if (chat.interaction_seq == 1) {
    const notes = message.body.replace('1o', '10').match(/\d+/g);
    let invalidNote
    let invalidNoteNegative
    if (notes) {
      invalidNote = notes.some(note => parseInt(note) > 10);
      invalidNoteNegative = notes.some(note => parseInt(note) < 0);
    }
    if (notes === null || notes.length == 0 || notes == undefined || invalidNote || invalidNoteNegative) {
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`)
      await Talk.create({
        chat_id: chat.id,
        reg: chat.reg,
        cellphone: message.from,
        chatnumber: message.to,
        message_ack: message.ack,
        message: `Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`,
        type: "to"
      });
      return
    }

    if (types.isInteger(parseInt(notes[0]))) {
      //const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)
      chat.returned = true
      chat.absoluteresp = parseInt(notes[0])
      chat.interaction_seq = 2
      chat.closed = false
      chat.date_return = DateTime.now()
      await chat.save()
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`)
      await Talk.create({
        chat_id: chat.id,
        reg: chat.reg,
        cellphone: message.from,
        chatnumber: message.to,
        message_ack: message.ack,
        message: `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`,
        type: "to"
      });
=======

import { NegativeResponse, PositiveResponse, stateTyping } from '../util'

export default async (client: Client, message: Message, chat: Chat) => {

  //PERGUNTA 1 - AVALIAÇÃO DE ATENDIMENTO
  if (chat.interaction_seq == 1) {
    const notes = message.body.match(/\d+/g);
    if (notes === null || notes.length == 0 || notes == undefined) {
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`)
      return
    }
    if (types.isInteger(parseInt(notes[0]))) {
      const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)
      chat.returned = true
      chat.absoluteresp = parseInt(notes[0])
      chat.interaction_seq = 2
      await chat.save()
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`)
      console.log(message.body)
>>>>>>> development
      return
    }
  }
  else
    if (chat.interaction_seq == 2) {

      if (message.body == '9') {
        client.sendMessage(message.from, `Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!`)
<<<<<<< HEAD
        await Talk.create({
          chat_id: chat.id,
          reg: chat.reg,
          cellphone: message.from,
          chatnumber: message.to,
          message: `Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!`,
          type: "to"
        });
=======
>>>>>>> development
        return
      }

      await stateTyping(message)//status de digitando...
<<<<<<< HEAD
      chat.date_return = DateTime.now()
      chat.response = message.body.slice(0, 599)
      chat.closed = false
      await chat.save()
      client.sendMessage(message.from, `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`)
      await Talk.create({
        chat_id: chat.id,
        reg: chat.reg,
        cellphone: message.from,
        chatnumber: message.to,
        message: `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`,
        type: "to"
      });

=======
      chat.response = message.body.slice(0, 599)
      await chat.save()
      client.sendMessage(message.from, `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`)
>>>>>>> development
    }


}


