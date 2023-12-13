import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import { DateTime } from 'luxon';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage() {
  let startTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE)
  let endtTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END)
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


  setInterval(async () => {
    const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    await getAgent(process.env.CHAT_NAME)
    if (!executingSendMessage?.valuebool) {
      if (await TimeSchedule()) {
        console.log(`Buscando dados no Smart: ${date}`)
        await PersistShippingcampaign()
      }
    }
  }, await GenerateRandomTime(startTimeSendMessageRepeated, endtTimeSendMessageRepeated, '****Send Message Repeated'))

}
module.exports = { sendRepeatedMessage }