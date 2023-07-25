import Chat from 'App/Models/Chat';
import { Client } from 'whatsapp-web.js';
import ConfirmSchedule from './ConfirmSchedule'

export default class Monitoring {
  async monitoring(client: Client) {
    console.log("CHAT MONITORING................")
    try {
      client.on('message', async message => {
        const chat = await Chat.query().where('cellphoneserialized', '=', message.from).whereNull('response').first()
        if (chat) {
          if (chat.interaction_id == 1)
            await ConfirmSchedule(client, message, chat)
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

      });

    } catch (error) {

      console.log("ERRO>>>>", error)

    }


  }


}

