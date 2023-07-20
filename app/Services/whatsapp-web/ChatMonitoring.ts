import { Client } from 'whatsapp-web.js';
import Chat from 'App/Models/Chat';

export default class Monitoring {

  async monitoring(client: Client) {

    console.log("CHAT MONITORING................")
    try {
      client.on('message', async message => {

        //const chat = await Chat.findBy('cellphoneserialized', message.from)
        const chat = await Chat.query().where('cellphoneserialized', '=', message.from).whereNull('response').first()
        if (chat) {
          if (chat.interaction == 1) {//confirmação de agenda
            if (message.body == 'Sim')//presença confirmada
            {
              client.sendMessage(message.from, "Tudo bem, sua presença foi confirmada. Obrigado!!!")
              chat.response = message.body
              await chat.save()
              //ir no Smart e marcar presença

            } else
              if (message.body == "Não")//Não vai confirmar a presença
              {
                chat.response = message.body
                chat.save()

                client.sendMessage(message.from, "Gostaria de reagendar para outro horário? \n1-Sim \n2-Não")
                let chat2 = new Chat()
                //chat2 = chat
                chat2.interaction = 2
                chat2.name = chat.name
                chat2.cellphone = chat.cellphone
                chat.cellphoneserialized = message.from
                chat2.message = "Gostaria de reagendar para outro horário? \n1-Sim \n2-Não"
                await Chat.create(chat2)
              }
          } if (chat.interaction == 2) {
            if (message.body == "Sim") {
              client.sendMessage(message.from, "Tudo bem, estamos encaminhando sua chamada.")
              //gerar um link e enviar para um determinado numero da atendente
            } else if (message.body == "Não") {
              client.sendMessage(message.from, "Tudo bem, iremos encerrar a conversa. A Neo agradece.")
            }

          }
        }

        console.log("MENSAGEM::", message.body, "numero", chat)



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

