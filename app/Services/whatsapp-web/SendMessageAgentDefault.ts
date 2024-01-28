import Agent from 'App/Models/Agent';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { Client } from "whatsapp-web.js"
import Customchat from 'App/Models/Customchat';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'

export default async (client: Client, agent: Agent) => {
  const startTimeSendMessage = agent.interval_init_message
  const endTimeSendMessage = agent.interval_final_message

  // async function _shippingCampaignList() {
  //   return await Shippingcampaign.query()
  //     .whereNull('phonevalid')
  //     .andWhere('messagesent', 0)
  //     .andWhere('created_at', '>', yesterday) // Certifique-se de usar a data correta aqui
  //     .whereNotExists((query) => {
  //       query.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
  //     }).first()
  // }

  async function customChatSendMessage() {
    return await Customchat.query()
      .where('messagesent', 0)
      .andWhereNotNull('message')
      .andWhereNull('phonevalid').first()
  }

  async function sendMessages() {
    setInterval(async () => {

      const customChat = await customChatSendMessage()
      if (customChat) {
        const validationCellPhone = await verifyNumber(client, customChat?.cellphone)
        if (validationCellPhone == null) {
          console.log("custom chat 1500", validationCellPhone)
          customChat.phonevalid = false
          await customChat.save()
        }

        if (validationCellPhone) {
          await client.sendMessage(validationCellPhone, customChat?.message)
            .then(async (response) => {
              console.log("passei no 15444")
              customChat.messagesent = true
              customChat.cellphoneserialized = validationCellPhone
              customChat.chatname = agent.name
              customChat.chatnumber = client.info.wid.user
              customChat.phonevalid = true
              await customChat.save()
            }).catch(async (error) => {
              console.log("ERRO 1452:::", error)
            })
          await Agent.query().where('id', agent.id).update({ statusconnected: true })
        }
      }

    }, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))
  }
  await sendMessages()
  return client
}

