import { stateTyping } from '../util'
import { verifyNumber } from '../VerifyNumber'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController';
import Chat from 'App/Models/Chat';
import { Client, Message } from 'whatsapp-web.js';

export default async (client: Client, message: Message, chat: Chat) => {

  //PERGUNTA 1 - GOSTARIA DE AGENDAR A CONSULTA
  if (chat.interaction_seq == 1) {
    if (message.body.toUpperCase() == 'SIM' || message.body == '1')//presença confirmada
    {
      await stateTyping(message)//status de digitando...
      const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)
      client.sendMessage(message.from, `Muito obrigada, seu agendamento foi confirmado, o endereço de sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp 3132350003.`)
      //client.sendMessage(message.from, `Teste>>>${chat.shippingcampaign.otherfields}`)
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

        const message2 = `Entendi, sabemos que nosso dia está muito atarefado. Favor clicar no link que estou enviando para conversar com nossa atendente e podermos agendar novo horário para você.`
        client.sendMessage(message.from, message2)
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
        Chat.create(chat2)

        const linkRedirecionamento = `https://api.whatsapp.com/send?phone=5531985228619&text=${encodeURIComponent("Olá, gostaria de fazer um reagendamento de consulta.")}`;
        client.sendMessage(message.from, linkRedirecionamento)


      } else (client.sendMessage(message.from, 'Resposta inválida, por favor responda \n1 para confirmar o agendamento. \n2 para reagendamento.'))
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




