import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Chat from 'App/Models/Chat';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import { sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
import { Client } from 'whatsapp-web.js';

import { stateTyping } from '../util'
import ConfirmSchedule from './ConfirmSchedule'

export default class Monitoring {
  async monitoring(client: Client) {

    try {
      client.on('message', async message => {

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
            client.sendMessage(message.from, "Olá, sou a Iris, atendente virtual do Neo.")
            return
          }

          else if (message.body.startsWith("#testar")) {
            //1 - buscar um contato
            //await sendRepeatedMessage(client, '3185228619')
          }

          else if (message.body.startsWith("verificar")) {
            const string = message.body;
            const numbers = string.match(/\d/g).join("");
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
            const sendResponse = `*Total diário:* ${result.totalDiario}\n*Telefones válidos:* ${result.telefonesValidos}\n*Mensagens Enviadas:* ${result.mensagensEnviadas}\n*Mensagens Retornadas:* ${result.mensagensRetornadas}\n*Confirmações:* ${result.confirmacoes}`
            await stateTyping(message)
            client.sendMessage(message.from, `*Posição diária até o momento:*`)
            client.sendMessage(message.from, sendResponse)


          }
          else if (message.body === "contsendreset") {
            global.contSend = 0
            client.sendMessage(message.from, `Conversas reinicializadas com sucesso!!!`)

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

          else if (message.body === 'PinChat') {

            console.log("CLIENTE", message)
          }

          else {
            client.sendMessage(message.from, "Olá, desculpe mas esta conversa já foi encerrada. O Neo Agradece! ")

          }

        }

      });

    } catch (error) {

      console.log("ERRO>>>>", error)

    }


  }


}

