import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import { DateTime } from 'luxon';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'


async function sendRepeatedMessage() {
  //let startTimeSendMessageRepeated: Number //= parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE)
  //let endtTimeSendMessageRepeated: Number //= parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END)
  console.log("ENTREI NO SEDREPEATEDMESSAGE")
  let agent

  async function getAgent(chatName: string) {
    console.log("GET AGENT...")
    agent = await Agent.findBy('name', chatName)
    if (!agent || agent == undefined) {
      console.log("Erro: Verifique o chatnumer")
      return
    }
    return agent
  }

  async function executePersistShippingcampaign(interval: number) {
    setInterval(async () => {
      const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
      agent = await getAgent(process.env.CHAT_NAME)
      //console.log("AGENTE>>>", agent)
      if (!executingSendMessage?.valuebool) {
        if (await TimeSchedule()) {
          console.log(`Buscando dados no Smart: ${date}`)
          await PersistShippingcampaign()
          console.log("INTERVAL")
        }
      }

    }, await GenerateRandomTime(agent.interval_init_query, agent.interval_final_query, '****Send Message Repeated'))

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




