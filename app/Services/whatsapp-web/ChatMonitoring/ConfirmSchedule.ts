import { stateTyping } from '../util'
import { verifyNumber } from '../VerifyNumber'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController';
import Chat from 'App/Models/Chat';
import { Client, Message } from 'whatsapp-web.js';

export default async (client: Client, message: Message, chat: Chat) => {

  //PERGUNTA 1 - GOSTARIA DE AGENDAR A CONSULTA
  //console.log("TESTANDO...", chat, "mensagem>>", message.body)

  if (chat.interaction_seq == 1) {

    const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)

    if (message.body.toUpperCase() == 'SIM' || message.body == '1')//presença confirmada
    {
      await stateTyping(message)//status de digitando...
      client.sendMessage(message.from, `Muito obrigada, seu agendamento foi confirmado, o endereço de sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp 3132350003.`)
      chat.response = message.body
      await chat.save()
      const datasourcesController = new DatasourcesController
      //Salvar no Smart e marcar presença
      await datasourcesController.confirmSchedule(chat.idexternal)
    } else
      //Não vai confirmar a presença
      if (message.body.toUpperCase() == "NÃO" || message.body.toUpperCase() == "NAO" || message.body.toUpperCase() == "2") {
        chat.response = message.body
        await chat.save()
        await stateTyping(message)

        const message2 = `Entendi, sabemos que nosso dia está muito atarefado. Favor clicar no link que estou enviando para conversar com nossa atendente e podermos agendar novo horário para você.`
        client.sendMessage(message.from, message2)

        const messageLink = `Olá, sou ${chat.name} e gostaria de reagendar uma consulta com ${chatOtherFields.medic}`
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
        chat2.message = message2
        chat2.response = "Reagendada"
        Chat.create(chat2)

      } else (client.sendMessage(message.from, 'Resposta inválida, por favor responda \n1 para confirmar o agendamento. \n2 para reagendamento.'))

  }

}


