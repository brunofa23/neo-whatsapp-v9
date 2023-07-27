import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { Client } from "whatsapp-web.js"

export default async (client: Client, shippingCampaignList: Shippingcampaign[]) => {

  async function sendMessages() {
    for (const dataRow of shippingCampaignList) {
      try {
        //await new Promise(resolve => setTimeout(resolve, 3000));
        if (dataRow.phonevalid && !dataRow.messagesent
          && (dataRow.cellphone == '31990691174' || dataRow.cellphone == '31998911872' || dataRow.cellphone == '31985228619')) {

          await client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
            .then((response) => {
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

        }
      } catch (error) {
        console.log("ERRO:::", error)
      }
    }
  }

  await sendMessages()




}
