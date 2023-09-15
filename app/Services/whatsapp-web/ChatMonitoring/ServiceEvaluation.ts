import { types } from '@ioc:Adonis/Core/Helpers'
import Chat from 'App/Models/Chat';
import { Client, Message } from 'whatsapp-web.js';

import { NegativeResponse, PositiveResponse, stateTyping } from '../util'

export default async (client: Client, message: Message, chat: Chat) => {

  //PERGUNTA 1 - AVALIAÇÃO DE ATENDIMENTO
  if (chat.interaction_seq == 1) {
    const notes = message.body.match(/\d+/g);
    console.log("PASSEI AQUI....", message.body, notes)

    if (notes === null || notes.length == 0 || notes == undefined) {
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Desculpe, não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10? 👍🏾👍🏾`)
      return
    }
    if (types.isInteger(parseInt(notes[0]))) {
      console.log("PASSEI NA RESPOSTA VALIDADA.....")
      const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)
      //chat.response = message.body.slice(0, 255)
      chat.returned = true
      chat.absoluteresp = parseInt(notes[0])
      chat.interaction_seq = 2
      await chat.save()
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Consegue nos dizer o que motivou a sua nota ${message.body}? Caso não queira responder digite 9 para finalizar essa etapa.`)
      console.log(message.body)
      return
    }
  }
  else
    if (chat.interaction_seq == 2) {
      await stateTyping(message)//status de digitando...
      chat.response = message.body.slice(0, 599)
      await chat.save()
      client.sendMessage(message.from, `Obrigado pela sua resposta! Agradecemos pela sua avaliação.`)

    }


}


