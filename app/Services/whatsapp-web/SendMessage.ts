import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { Client } from "whatsapp-web.js"

export default async (client: Client, shippingCampaignList: Shippingcampaign[]) => {

  for (const dataRow of shippingCampaignList) {
    try {
      if (dataRow.phonevalid && !dataRow.messagesent) {
        //const send = await client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
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
