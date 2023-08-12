import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { Client } from "whatsapp-web.js"

import moment = require('moment');
import { GenerateRandomTime, DateFormat, TimeSchedule, ExecutingSendMessage } from './util'
import { DateTime } from 'luxon';
import Config from 'App/Models/Config';

global.contSend = 0
let resetContSend = DateTime.local()
let resetContSendBool = false
const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE)
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END)

export default async (client: Client) => {

  async function sendMessages() {
    const executingSendMessage = await Config.find('executingSendMessage')
    if (executingSendMessage?.valuebool)
      return

    setInterval(async () => {
      if (await !TimeSchedule())
        return

      const shippingCampaignList = await Shippingcampaign.query()
        .whereNull('phonevalid')
        .andWhere('messagesent', '=', '0')
        .andWhere('created_at', '>=', yesterday)

      const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
      const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
      const maxLimitSendMessage = await Shippingcampaign.query()
        .where('messagesent', '=', '1')
        .andWhereBetween('created_at', [dateStart, dateEnd])

      // const shippingCampaignMap = shippingCampaignList.map(campaign => {
      //   return { id: campaign.id, cellphone: campaign.cellphone, name: campaign.name, phonevalid: campaign.phonevalid };
      // });
      // console.log("SHIPPONG CAMPAIGN LIST", shippingCampaignMap)

      if (maxLimitSendMessage.length >= parseInt(process.env.MAX_LIMIT_SEND_MESSAGE)) {
        console.log(`LIMITE MÁXIMO DIÁRIO DE ENVIOS ATINGIDOS:${process.env.MAX_LIMIT_SEND_MESSAGE}`)
        return
      }

      for (const dataRow of shippingCampaignList) {
        console.log("Entrei no SendMessages...")
        const time = await GenerateRandomTime(20, 30)
        //*************************** */
        await ExecutingSendMessage(true)

        if (global.contSend < 2) {

          if (global.contSend < 0) {
            global.contSend = 0
          }

          try {
            //verificar o numero
            const validationCellPhone = await verifyNumber(client, dataRow.cellphone)
            console.log(`VALIDAÇÃO DE TELEFONE DO PACIENTE:${dataRow.name}:`, validationCellPhone)

            if (validationCellPhone) {
              await client.sendMessage(validationCellPhone, dataRow.message)
                .then(async (response) => {
                  global.contSend++
                  dataRow.messagesent = true
                  dataRow.phonevalid = true
                  dataRow.cellphoneserialized = validationCellPhone
                  dataRow.save()

                  const bodyChat = {
                    interaction_id: dataRow.interaction_id,
                    interaction_seq: dataRow.interaction_seq,
                    idexternal: dataRow.idexternal,
                    reg: dataRow.reg,
                    name: dataRow.name,
                    cellphone: dataRow.cellphone,
                    cellphoneserialized: dataRow.cellphoneserialized,
                    message: dataRow.message,
                    shippingcampaigns_id: dataRow.id,
                    chatname: process.env.CHAT_NAME

                  }
                  await Chat.create(bodyChat)

                }).catch((error) => {
                  console.log("ERRRRO:::", error)
                })

              await new Promise(resolve => setTimeout(resolve, time));
              console.log("Mensagem enviada:", dataRow.name, "cellphone", dataRow.cellphoneserialized, "phonevalid", dataRow.phonevalid)
            } else {//número é inválido
              dataRow.phonevalid = false
              dataRow.save()

            }

          } catch (error) {
            console.log("ERRO:::", error)
            await ExecutingSendMessage(false)
          }
        } else if (global.contSend >= 3) {
          if (resetContSendBool == false) {
            resetContSend = DateTime.local().plus({ minutes: 4 })
            resetContSendBool = true
          }
          else if (resetContSend <= DateTime.local()) {
            resetContSendBool = false
            global.contSend = 0
          }
        }
        //console.log("valor do contSend", global.contSend)
        //****************************** */
      }
      //global.executingSendMessage = false
      await ExecutingSendMessage(false)

    }, await GenerateRandomTime(startTimeSendMessage,
      endTimeSendMessage, '----Time Send Message'))
  }


  await sendMessages()
}
