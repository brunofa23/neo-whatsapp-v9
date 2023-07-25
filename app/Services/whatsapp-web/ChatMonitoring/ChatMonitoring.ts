import DatasourcesController from 'App/Controllers/Http/DatasourcesController';
import Chat from 'App/Models/Chat';
import { Client } from 'whatsapp-web.js';

import { verifyNumber } from '../VerifyNumber'

import ConfirmSchedule from './ConfirmSchedule'

async function stateTyping(message) {
  const chatTyping = await message.getChat();
  chatTyping.sendStateTyping();
  return await new Promise(resolve => setTimeout(resolve, 3000));
}

export default class Monitoring {
  async monitoring(client: Client) {
    console.log("CHAT MONITORING................")
    try {
      client.on('message', async message => {
        const chat = await Chat.query().where('cellphoneserialized', '=', message.from).whereNull('response').first()
        if (chat) {
          await ConfirmSchedule(client, chat)

          if (chat.interaction_id == 1) {//confirmação de agenda
            //interação 1 *************************
            if (chat.interaction_seq == 1) {//PERGUNTA 1 - GOSTARIA DE AGENDAR A CONSULTA
              if (message.body.toUpperCase() == 'SIM' || message.body == '1')//presença confirmada
              {
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
                  //vai para interação 2

                  //await new Promise(resolve => setTimeout(resolve, 3000));
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


                  // simulates typing in the chat



                } else (client.sendMessage(message.from, 'Resposta inválida, por favor responda 1-Sim ou 2-Não.'))
            } else
              if (chat.interaction_seq == 2) {//PERGUNTA 2 -
                const chat2 = await Chat.find(chat.id)
                if (message.body == "Sim") {//GOSTARIA DE REAGENDAR

                  //await new Promise(resolve => setTimeout(resolve, 3000));
                  await stateTyping(message)
                  client.sendMessage(message.from, "Tudo bem, estamos encaminhando sua chamada.")
                  //const numeroDestino = '5531990691174';
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

                } else if (message.body == "Não") {

                  //await new Promise(resolve => setTimeout(resolve, 3000));
                  stateTyping(message)
                  client.sendMessage(message.from, "Tudo bem, iremos encerrar a conversa. A Neo agradece.")
                  chat2.response = message.body
                  await chat2.save()
                }

              }


            //********************************************/
          }
        }
        //console.log("MENSAGEM::", message.body, "numero", chat)

        if (message.body === 'ola') {

          const chatTyping = await message.getChat();
          chatTyping.sendStateTyping();
          // Aguarda 3 segundos
          await new Promise(resolve => setTimeout(resolve, 3000));
          // Envia a resposta após o status "digitando"
          client.sendMessage(message.from, 'Estou digitando!');

        }

        if (message.body.startsWith("verificar")) {
          const string = message.body;
          const numbers = string.match(/\d/g).join("");
          console.log("Resultado do telefone:", numbers)

          try {
            client.getNumberId(numbers).then((result) => {
              console.log('Number ID:', result);
            }).catch((error) => {
              console.error('Failed to get number ID:', error);
            });

            //console.log("GET NUMBERID>>>", verifyNumber)

          } catch (error) {
            console.log("ERRO:::", error)
          }
        }


        if (message.body.toUpperCase() === "SIM") {

        }

      });

    } catch (error) {

      console.log("ERRO>>>>", error)

    }


  }


}

