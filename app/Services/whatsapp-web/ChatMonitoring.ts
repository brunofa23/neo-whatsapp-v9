import { Client } from 'whatsapp-web.js';

export default class Monitoring {

  async monitoring(client: Client) {

    console.log("CHAT MONITORING................")
    try {
      client.on('message', async message => {

        console.log("MENSAGEM::", message.from)


        if (message.body === 'ola') {
          client.sendMessage(message.from, "Olá tudo bem com vc?")
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

