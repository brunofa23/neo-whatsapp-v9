import Chat from 'App/Models/Chat';
import { Client } from 'whatsapp-web.js';

import ConfirmSchedule from './ConfirmSchedule'

export default class Monitoring {
  async monitoring(client: Client) {

    try {
      client.on('message', async message => {
        const chat = await Chat.query()
          .preload('shippingcampaign')
          .where('cellphoneserialized', '=', message.from)
          .whereNull('response').first()

        if (chat) {
          if (chat.interaction_id == 1) {
            await ConfirmSchedule(client, message, chat)
            return
          }

        } else {
          if (message.body.toUpperCase() === 'OI' || message.body.toUpperCase() === 'OLÁ') {
            console.log("ENTREI NO OI...")
            client.sendMessage(message.from, "Olá, sou a atendente virtual.")
            return
          }

          else if (message.body.startsWith("verificar")) {
            const string = message.body;
            const numbers = string.match(/\d/g).join("");
            console.log("Resultado do telefone:", numbers)

            try {
              client.getNumberId(numbers).then((result) => {
                console.log('Number ID:', result);
                client.sendMessage(message.from, "teste")
              }).catch((error) => {
                console.error('Failed to get number ID:', error);
              });
              //console.log("GET NUMBERID>>>", verifyNumber)
            } catch (error) {
              console.log("ERRO:::", error)
            }
            return
          }

          else if (message.body === "destroy") {
            //client.destroy()
            client.logout()
              .then(() => {
                console.log('Conversa encerrada com sucesso.');
              })
              .catch((error) => {
                console.error('Erro ao encerrar a conversa:', error);
              });
            return
          }

          // else if (chat) {
          //   client.sendMessage(message.from, "Olá, esta conversa já foi encerrada. O Neo Agradece. ")

          // }

        }

      });

    } catch (error) {

      console.log("ERRO>>>>", error)

    }


  }


}

