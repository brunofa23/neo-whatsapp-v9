import Shippingcampaign from "App/Models/Shippingcampaign"
import { Client } from "whatsapp-web.js"
import Chat from "App/Models/Chat"

export default async (client: Client, shippingCampaignList: Shippingcampaign[]) => {

  //4 - Enviar a mensagem...
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
          interaction: dataRow.interaction,
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
