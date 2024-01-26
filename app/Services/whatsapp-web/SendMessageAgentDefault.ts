//import { DateFormat, ExecutingSendMessage, GenerateRandomTime, TimeSchedule } from './util'
//import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Agent from 'App/Models/Agent';
//import Chat from "App/Models/Chat"
//import Interaction from 'App/Models/Interaction';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { Client } from "whatsapp-web.js"



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

      const validationCellPhone = await verifyNumber(client, shippingCampaign?.cellphone)

      await client.sendMessage('553185228619@c.us', "teste de envio")
        .then(async (response) => {
          console.log(response)
        }).catch(async (error) => {
          console.log("ERRO 1452:::", error)
        })

      await Agent.query().where('id', agent.id).update({ statusconnected: true })

    }, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))
  }
  await sendMessages()

  return client
}

// async function teste() {
//   console.log("teste 15454")
// }

// module.exports = { teste }
