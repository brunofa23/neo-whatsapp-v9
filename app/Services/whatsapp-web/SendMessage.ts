import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { Client } from "whatsapp-web.js"

global.executingSendMessage = false
const timeExecuteSendMessage: number = process.env.EXECUTE_SEND_MESSAGE

export default async (client: Client, shippingCampaignList: Shippingcampaign[]) => {
  async function sendMessages() {

    for (const dataRow of shippingCampaignList) {
      //*************************** */
      global.executingSendMessage = true
      try {
        await new Promise(resolve => setTimeout(resolve, timeExecuteSendMessage));
        if (dataRow.phonevalid && !dataRow.messagesent) {
          await client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
            .then(async (response) => {
              dataRow.messagesent = true
              dataRow.save()

            }).catch((error) => {
              console.log("ERRRRO:::", error)
            })

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
          console.log("Mensagem enviada:", dataRow.name, "cellphone", dataRow.cellphoneserialized, "phonevalid", dataRow.phonevalid)

        }

      } catch (error) {
        console.log("ERRO:::", error)
      }


      //****************************** */
    }
    global.executingSendMessage = false
  }
  await sendMessages()
}
