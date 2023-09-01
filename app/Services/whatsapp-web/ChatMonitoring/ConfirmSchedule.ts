import DatasourcesController from 'App/Controllers/Http/DatasourcesController';
import Chat from 'App/Models/Chat';
import { Client, Message } from 'whatsapp-web.js';

import { NegativeResponse, PositiveResponse, stateTyping } from '../util'
import { verifyNumber } from '../VerifyNumber'

export default async (client: Client, message: Message, chat: Chat) => {

  //PERGUNTA 1 - GOSTARIA DE AGENDAR A CONSULTA
  if (chat.interaction_seq == 1) {

    const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)
    if (await PositiveResponse(message.body)) {//presença confirmada
      await stateTyping(message)//status de digitando...
      try {
        client.sendMessage(message.from, `Muito obrigada, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp 3132350003.`)
        chat.response = message.body.slice(0, 255)
        chat.returned = true
        chat.absoluteresp = 1
        await chat.save()
      } catch (error) {
        console.log("Erro 454:", error)
      }
      //Salvar no Smart e marcar presença
      const datasourcesController = new DatasourcesController
      await datasourcesController.confirmSchedule(chat, chatOtherFields)
    } else
      //CANCELAR AGENDAMENTO
      if (await NegativeResponse(message.body)) {
        chat.response = message.body
        chat.absoluteresp = 2

        try {
          await chat.save()
        } catch (error) {
          console.log("Erro 121:", error)
        }
        //CANCELA MARCAÇÃO NO SMART
        const datasourcesController = new DatasourcesController
        await datasourcesController.cancelSchedule(chat, chatOtherFields)

        await stateTyping(message)
        const message2 = `Entendi, sabemos que nosso dia está muito atarefado! Sua consulta foi cancelada, se deseja reagendar, clique no link que estou enviando para conversar com uma de nossas atendentes e podermos agendar novo horário para você.`
        client.sendMessage(message.from, message2)

        const messageLink = `Olá, sou ${chat.name} e gostaria de reagendar uma consulta com ${chatOtherFields.medic}.`
        const phoneNumber = "553132350003"
        const encodedMessage = encodeURIComponent(messageLink);
        const linkRedirect = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
        client.sendMessage(message.from, linkRedirect)

        const chat2 = new Chat()
        chat2.interaction_id = chat.interaction_id
        chat2.interaction_seq = 2
        chat2.idexternal = chat.idexternal
        chat2.reg = chat.reg
        chat2.name = chat.name
        chat2.cellphone = chat.cellphone
        chat2.cellphoneserialized = message.from
        chat2.shippingcampaigns_id = chat.shippingcampaigns_id
        chat2.message = message2.slice(0, 348)
        chat2.response = "Reagendada"
        chat2.returned = true
        try {
          Chat.create(chat2)
        } catch (error) {
          console.log("Erro:", error)
        }

      } else {
        await stateTyping(message)
        client.sendMessage(message.from, 'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.')
      }

  }

}


