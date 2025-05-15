import { types } from '@ioc:Adonis/Core/Helpers'
import Chat from 'App/Models/Chat';
import { Client, Message } from 'whatsapp-web.js';
import { stateTyping } from '../util'
import { DateTime } from 'luxon';

export default async (client: Client, message: Message, chat: Chat) => {

  if (message.hasMedia) {
    await stateTyping(message)
    client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos, apenas digite uma nota de 0 a 10.')
    return
  }

  

  //PERGUNTA 1 - AVALIAÇÃO DE ATENDIMENTO
  if (chat.interaction_seq == 1) {
    const notes = message.body.replace('1o','10').match(/\d+/g);
    let invalidNote
    let invalidNoteNegative
    if (notes) {
      invalidNote = notes.some(note => parseInt(note) > 10);
      invalidNoteNegative = notes.some(note => parseInt(note) < 0);
    }
    if (notes === null || notes.length == 0 || notes == undefined || invalidNote || invalidNoteNegative) {
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`)
      return
    }

    if (types.isInteger(parseInt(notes[0]))) {
      //const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)
      chat.returned = true
      chat.absoluteresp = parseInt(notes[0])
      chat.interaction_seq = 2
      chat.closed=false
      chat.date_return =DateTime.now()
      await chat.save()
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`)
      return
    }
  }
  else
    if (chat.interaction_seq == 2) {

      if (message.body == '9') {
        client.sendMessage(message.from, `Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!`)
        return
      }

      await stateTyping(message)//status de digitando...
      chat.date_return =DateTime.now()
      chat.response = message.body.slice(0, 599)
      chat.closed=false
      await chat.save()
      client.sendMessage(message.from, `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`)
    }


}


