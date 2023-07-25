import DatasourcesController from 'App/Controllers/Http/DatasourcesController';
import Chat from 'App/Models/Chat';
import { Client, Message } from 'whatsapp-web.js';

import { verifyNumber } from '../VerifyNumber'
import { stateTyping } from '../util'

export default async (client: Client, message: Message, chat: Chat) => {

  //PERGUNTA 1 - GOSTARIA DE AGENDAR A CONSULTA
  if (chat.interaction_seq == 1) {
    if (message.body.toUpperCase() == 'SIM' || message.body == '1')//presença confirmada
    {
      await stateTyping(message)
      client.sendMessage(message.from, "Tudo bem, sua presença foi confirmada. Obrigado!!!")
      chat.response = message.body
      await chat.save()
      const datasourcesController = new DatasourcesController
      //Salvar no Smart e marcar presença
      await datasourcesController.confirmSchedule(chat.idexternal)
    } else
      if (message.body.toUpperCase() == "NÃO" || message.body.toUpperCase() == "NAO" || message.body.toUpperCase() == "2")//Não vai confirmar a presença
      {
        chat.response = message.body
        await chat.save()
        await stateTyping(message)

        client.sendMessage(message.from, "Gostaria de reagendar para outro horário? \n1-Sim \n2-Não")
        const chat2 = new Chat()
        chat2.interaction_id = chat.interaction_id
        chat2.interaction_seq = 2
        chat2.idexternal = chat.idexternal
        chat2.reg = chat.reg
        chat2.name = chat.name
        chat2.cellphone = chat.cellphone
        chat2.cellphoneserialized = message.from
        chat2.shippingcampaigns_id = chat.shippingcampaigns_id
        chat2.message = "Gostaria de reagendar para outro horário? \n1-Sim \n2-Não"
        Chat.create(chat2)

      } else (client.sendMessage(message.from, 'Resposta inválida, por favor responda \n1-Sim \n2-Não.'))
  } else
    //PERGUNTA 2 - GOSTARIA DE REAGENDAR
    if (chat.interaction_seq == 2) {
      const chat2 = await Chat.find(chat.id)
      if (message.body.toUpperCase() == "SIM" || message.body == "1") {
        await stateTyping(message)
        client.sendMessage(message.from, "Tudo bem, estamos encaminhando sua chamada...")
        const numeroDestino = await verifyNumber(client, '5531985228619')
        console.log("NUMERO DESTINO", numeroDestino)
        const mensagem = `Olá ${chat.name} para quando gostaria de reagendar a consulta?`;

        const linkRedirecionamento = `https://api.whatsapp.com/send?phone=${chat.cellphone}&text=${encodeURIComponent(mensagem)}`;

        client.sendMessage(numeroDestino, `${linkRedirecionamento}`).then(async () => {
          console.log('Mensagem enviada!');
          chat2.response = message.body
          await chat2.save()
        }).catch((erro) => {
          console.error('Erro ao enviar a mensagem:', erro);
        });

      } else if (message.body.toUpperCase() == "NÃO" || message.body.toUpperCase() == "NAO" || message.body == "2") {
        await stateTyping(message)
        client.sendMessage(message.from, "Tudo bem, iremos encerrar a conversa. A Neo agradece.")
        chat2.response = message.body
        await chat2.save()
      }

    }

  return "teste confirm schedule"
}




