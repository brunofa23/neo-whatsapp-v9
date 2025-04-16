import Agent from 'App/Models/Agent';
import Customchat from 'App/Models/Customchat';
//import Shippingcampaign from 'App/Models/Shippingcampaign';
//import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { Client } from "whatsapp-web.js"
import Talk from 'App/Models/Talk';

import { DateFormat, extractCellphone, GenerateRandomTime, TimeSchedule } from './util'

export default async (client: Client, agent: Agent) => {
  const startTimeSendMessage = agent.interval_init_message
  const endTimeSendMessage = agent.interval_final_message

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
        //const validationCellPhone = await verifyNumber(client, customChat?.cellphone)
        const validationCellPhone = await client.getNumberId(customChat.cellphone)
        if (validationCellPhone == null) {
          customChat.phonevalid = false
          await customChat.save()
        }
        if (validationCellPhone) {
          await client.sendMessage(validationCellPhone._serialized, customChat?.message)
            .then(async (response) => {
              customChat.messagesent = true
              customChat.cellphoneserialized = validationCellPhone._serialized
              customChat.chatname = agent.name
              customChat.chatnumber = client.info.wid.user
              customChat.read = false
              customChat.phonevalid = true

              await customChat.save()
              await Talk.create({
                cellphone:await extractCellphone(customChat.cellphone),
                chatnumber: client.info.wid.user,
                message: customChat.message,
                type: "to"
              })

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

