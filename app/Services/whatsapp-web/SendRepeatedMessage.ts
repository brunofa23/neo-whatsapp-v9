import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import { DateTime } from 'luxon';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage() {
  //let startTimeSendMessageRepeated: Number //= parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE)
  //let endtTimeSendMessageRepeated: Number //= parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END)

  async function getAgent(chatName: string) {
    console.log("GET AGENT...")
    const agent = await Agent.findBy('name', chatName)
    if (!agent || agent == undefined) {
      console.log("Erro: Verifique o chatnumer")
      return
    }
    interval = await GenerateRandomTime(agent.interval_init_query, agent.interval_final_query, '****Send Message Repeated')
    //console.log("CONTIUAÇÃO>>>>>>", startTimeSendMessageRepeated, endtTimeSendMessageRepeated)
  }

  async function executePersistShippingcampaign(interval: number) {
    setInterval(async () => {
      const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
      await getAgent(process.env.CHAT_NAME)
      if (!executingSendMessage?.valuebool) {
        if (await TimeSchedule()) {
          console.log(`Buscando dados no Smart: ${date}`)
          await PersistShippingcampaign()
          console.log("INTERVAL", interval)
        }
      }

    }, interval)
  }

  let interval: number = 0
  await getAgent(process.env.CHAT_NAME)
  const executingSendMessage = await Config.find('executingSendMessage')
  await executePersistShippingcampaign(interval)

  // setInterval(async () => {
  //   const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
  //   await getAgent(process.env.CHAT_NAME)
  //   if (!executingSendMessage?.valuebool) {
  //     if (await TimeSchedule()) {
  //       console.log(`Buscando dados no Smart: ${date}`)
  //       await PersistShippingcampaign()
  //       console.log("INTERVAL", interval)
  //     }
  //   }

  // }, interval)




}
module.exports = { sendRepeatedMessage }




