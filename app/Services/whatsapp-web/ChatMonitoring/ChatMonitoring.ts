import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Chat from 'App/Models/Chat';
import { Client } from 'whatsapp-web.js';
import { stateTyping, DateFormat } from '../util'
import ConfirmSchedule from './ConfirmSchedule'


async function verifyNumberInternal(phoneVerify: String) {
  const list_phone_talking = process.env.LIST_PHONES_TALK
  const list_phones = list_phone_talking?.split(",")

  for (const phone of list_phones) {
    console.log("passei no verify internals")
    if (phoneVerify === phone)
      return true
  }

}

export default class Monitoring {
  async monitoring(client: Client) {

    try {
      client.on('message', async message => {

        if (await verifyNumberInternal(message.from)) {
          return
        }

        const chat = await Chat.query()
          .preload('shippingcampaign')
          .where('cellphoneserialized', '=', message.from)
          .whereNull('response').first()

        if (chat && chat.returned == false) {
          //console.log("PASSEI PELO RESPOSTA")
          chat.invalidresponse = message.body.slice(0, 348)
          chat.returned = true
          await chat.save()
        }

        if (chat) {
          global.contSend--
          if (chat.interaction_id == 1) {
            await ConfirmSchedule(client, message, chat)
            return
          }

        } else {
          if (message.body.toUpperCase() === 'OI' || message.body.toUpperCase() === 'OLÁ') {
            console.log("ENTREI NO OI...")
            await stateTyping(message)
            client.sendMessage(message.from, "Olá, sou a Iris, atendente virtual do Neo.")
            return
          }
          else if (message.body.startsWith("verificar")) {
            const string = message.body;
            const numbers = string.match(/\d/g).join("");
            await stateTyping(message)
            console.log("Resultado do telefone:", numbers)

            try {
              client.getNumberId(numbers).then((result) => {
                console.log('Number ID:', result);
                if (result)
                  client.sendMessage(message.from, `Número de Whatsapp validado: ${result?._serialized}`)
                if (!result || result._serialized === undefined)
                  client.sendMessage(message.from, `Número não identificado para o Whatsapp.`)
              }).catch((error) => {
                console.error('Failed to get number ID:', error);
              });
              //console.log("GET NUMBERID>>>", verifyNumber)
            } catch (error) {
              console.log("ERRO:::", error)
            }
            return
          }
          else if (message.body.toUpperCase() === "#PD") {//posição diária
            const pd = new ShippingcampaignsController()
            const result = await pd.dayPosition()
            const sendResponse = `*Total diário:* ${result.totalDiario}\n*Telefones válidos:* ${result.telefonesValidos}\n*Mensagens Enviadas:* ${result.mensagensEnviadas}\n*Mensagens Retornadas:* ${result.mensagensRetornadas}\n*Confirmações:* ${result.confirmacoes}\n*Reagendamentos:* ${result.reagendamentos}`
            await stateTyping(message)
            client.sendMessage(message.from, `*Posição diária até o momento:*`)
            client.sendMessage(message.from, sendResponse)


          }
          // else if (message.body === "destroy") {
          //   //client.destroy()
          //   client.logout()
          //     .then(() => {
          //       console.log('Conversa encerrada com sucesso.');
          //     })
          //     .catch((error) => {
          //       console.error('Erro ao encerrar a conversa:', error);
          //     });
          //   return
          // }

          else if (message.body === 'PinChat') {

            console.log("CLIENTE", message)
          }

          else {
            await stateTyping(message)
            client.sendMessage(message.from, "Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi encerrada. O Neo Agradece! ")

          }

        }

      });

    } catch (error) {

      console.log("ERRO>>>>", error)

    }


  }


}

