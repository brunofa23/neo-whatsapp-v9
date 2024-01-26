import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Agent from 'App/Models/Agent';
import Chat from "App/Models/Chat"
import Interaction from 'App/Models/Interaction';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { DateTime, VERSION } from 'luxon';
import { Client } from "whatsapp-web.js"

import { DateFormat, ExecutingSendMessage, GenerateRandomTime, TimeSchedule } from './util'

global.contSend = 0
const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')

export default async (client: Client, agent: Agent) => {
  const startTimeSendMessage = agent.interval_init_message
  const endTimeSendMessage = agent.interval_final_message

  async function _shippingCampaignList() {

    return await Shippingcampaign.query()
      .whereNull('phonevalid')
      .andWhere('messagesent', 0)
      .andWhere('created_at', '>', yesterday) // Certifique-se de usar a data correta aqui
      .whereNotExists((query) => {
        query.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
      }).first()


  }


  async function sendMessages() {
    setInterval(async () => {

      await client.sendMessage('553185228619@c.us', "teste de envio")
        .then(async (response) => {
          console.log(response)
        }).catch(async (error) => {
          console.log("ERRO 1452:::", error)
        })

      await Agent.query().where('id', agent.id).update({ statusconnected: true })

    }, await GenerateRandomTime(5, 15, '----Time Send Message'))
  }

  await sendMessages()

}
