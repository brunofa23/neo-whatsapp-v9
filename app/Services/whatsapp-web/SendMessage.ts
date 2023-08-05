import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { Client } from "whatsapp-web.js"
import moment = require('moment');
import { GenerateRandomTime } from './util'

global.executingSendMessage = false
global.contSend = 0


export default async (client: Client) => {
  async function sendMessages() {

    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const shippingCampaignList = await Shippingcampaign.query().whereNull('phonevalid')
      .andWhere('created_at', '>=', yesterday)
      .whereNull('messagesent')
      .orWhere('messagesent', '=', 0)
      .whereNotNull('cellphone')

    // const shippingCampaignMap = shippingCampaignList.map(campaign => {
    //   return { id: campaign.id, cellphone: campaign.cellphone, name: campaign.name, phonevalid: campaign.phonevalid };
    // });
    // console.log("SHIPPONG CAMPAIGN LIST", shippingCampaignMap)

    for (const dataRow of shippingCampaignList) {

      const time = await GenerateRandomTime(1200, 1600)
      //*************************** */
      global.executingSendMessage = true
      if (global.contSend < 4) {
        console.log("valor do contSend", global.contSend)
        try {
          await new Promise(resolve => setTimeout(resolve, time));
          console.log("TIME", time)
          //verificar o numero
          const validationCellPhone = await verifyNumber(client, dataRow.cellphone)
          console.log("VALIDAÇÃO DE TELEFONE", validationCellPhone)
          global.contSend++
          if (validationCellPhone) {
            await client.sendMessage(validationCellPhone, dataRow.message)
              .then(async (response) => {
                console.log("Entrei no envio", validationCellPhone)
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
                  shippingcampaigns_id: dataRow.id
                }
                await Chat.create(bodyChat)

              }).catch((error) => {
                console.log("ERRRRO:::", error)
              })
            console.log("Mensagem enviada:", dataRow.name, "cellphone", dataRow.cellphoneserialized, "phonevalid", dataRow.phonevalid)

          }

        } catch (error) {
          console.log("ERRO:::", error)
        }

      }
      //****************************** */
    }
    global.executingSendMessage = false
  }
  await sendMessages()
}
