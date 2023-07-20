import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'
import { Client } from 'whatsapp-web.js';
import Chat from 'App/Models/Chat';


export default class Monitoring {

  async monitoring(client: Client) {

    console.log("CHAT MONITORING................")
    try {
      client.on('message', async message => {

        //const chat = await Chat.findBy('cellphoneserialized', message.from)
        const chat = await Chat.query().where('cellphoneserialized', '=', message.from).whereNull('response').first()
        let chat2 = new Chat()
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

                chat2.interaction = 2
                chat2.name = chat.name
                chat2.cellphone = chat.cellphone
                chat2.cellphoneserialized = message.from
                chat2.message = "Gostaria de reagendar para outro horário? \n1-Sim \n2-Não"
                await Chat.create(chat2)
              }
          } if (chat.interaction == 2) {
            if (message.body == "Sim") {
              client.sendMessage(message.from, "Tudo bem, estamos encaminhando sua chamada.")
              //const numeroDestino = '5531990691174';
              const numeroDestino = await verifyNumber(client, '5531990691174')
              console.log("NUMERO DESTINO", numeroDestino)
              const mensagem = `Olá ${chat.name} para quando gostaria de reagendar a consulta?`;
              const linkRedirecionamento = `https://api.whatsapp.com/send?phone=${chat.cellphone}&text=${encodeURIComponent(mensagem)}`;

              //client.sendMessage(numeroDestino, "Segue o link para reagendamento de Consulta...")
              client.sendMessage(numeroDestino, `${linkRedirecionamento}`).then(() => {
                console.log('Mensagem enviada!');
              }).catch((erro) => {
                console.error('Erro ao enviar a mensagem:', erro);
              });

              //gerar um link e enviar para um determinado numero da atendente
            } else if (message.body == "Não") {
              client.sendMessage(message.from, "Tudo bem, iremos encerrar a conversa. A Neo agradece.")
              chat2.message = message.body
              chat.save()
            }

          }
        }

        //console.log("MENSAGEM::", message.body, "numero", chat)



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

