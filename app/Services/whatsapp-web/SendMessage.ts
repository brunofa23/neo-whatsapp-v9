import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { Client } from "whatsapp-web.js"

global.executingSendMessage = false
export default async (client: Client, shippingCampaignList: Shippingcampaign[]) => {
  async function sendMessages() {

    for (const dataRow of shippingCampaignList) {
      //*************************** */
      global.executingSendMessage = true
      console.log("VALOR dentro do loop", global.executingSendMessage)
      try {
        await new Promise(resolve => setTimeout(resolve, 8000));
        if (dataRow.phonevalid && !dataRow.messagesent
          //&& (dataRow.cellphone == '31990691174' || dataRow.cellphone == '31998911872' || dataRow.cellphone == '31985228619' || dataRow.cellphone == '31987840445')
        ) {
          await client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
            .then(async (response) => {
              dataRow.messagesent = true
              dataRow.save()

            }).catch((error) => {
              console.log("ERRRRO:::", error)
            })
        }

      } catch (error) {
        console.log("ERRO:::", error)
      }

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
      console.log("Mensagem enviada:", dataRow.name)


      //****************************** */
    }
    global.executingSendMessage = false
  }
  await sendMessages()
}
