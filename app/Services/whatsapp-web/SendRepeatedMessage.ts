import Agent from 'App/Models/Agent';
<<<<<<< HEAD
import PersistShippingcampaign from './PersistShippingcampaign';
import { getTargetDates, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage(agent: Agent) {
  //const executingSendMessage = await Config.find('executingSendMessage')
  // setInterval(async () => {
  //   //const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
  //   const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local().setZone('America/Sao_Paulo'))

  //   if (!executingSendMessage?.valuebool) {
  //     if (await TimeSchedule()) {
  //       console.log(`Buscando dados no Smart: ${date}`)
  //       await PersistShippingcampaign(date)
  //     }
  //   }
  // }, await GenerateRandomTime(500, 800, '****Send Message Repeated'))
  setInterval(async () => {
    const targetDates = getTargetDates()
    //if (!executingSendMessage?.valuebool) {
    if (await TimeSchedule()) {
      for (const date of targetDates) {
        const formatted = date.toFormat('yyyy-MM-dd')
        console.log(`Buscando dados no Smart(Server): ${formatted}`)
        await PersistShippingcampaign(formatted)
      }
    }
    //}
  }, await GenerateRandomTime(800, 900, '****Send Message Repeated'))

}



export { sendRepeatedMessage }
=======
import Config from 'App/Models/Config';
import { DateTime } from 'luxon';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage() {
  let startTimeSendMessageRepeated //= parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE)
  let endtTimeSendMessageRepeated //= parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END)
  const executingSendMessage = await Config.find('executingSendMessage')

  async function getAgent(chatName: string) {
    const agent = await Agent.findBy('name', chatName)
    if (!agent || agent == undefined) {
      console.log("Erro: Verifique o chatnumer")
      return
    }
    startTimeSendMessageRepeated = agent.interval_init_query
    endtTimeSendMessageRepeated = agent.interval_final_query
  }

  await getAgent(process.env.CHAT_NAME)
  setInterval(async () => {
    const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    //await getAgent(process.env.CHAT_NAME)
    if (!executingSendMessage?.valuebool) {
      if (await TimeSchedule()) {
        console.log(`Buscando dados no Smart: ${date}`)
        await PersistShippingcampaign()
      }
    }
  }, await GenerateRandomTime(startTimeSendMessageRepeated, endtTimeSendMessageRepeated, '****Send Message Repeated'))

}
module.exports = { sendRepeatedMessage }
>>>>>>> development
