import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import { DateTime } from 'luxon';
import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage(agent: Agent) {

  const startTimeSendMessageRepeated = agent.interval_init_query
  let endtTimeSendMessageRepeated = agent.interval_final_query
  const executingSendMessage = await Config.find('executingSendMessage')

  setInterval(async () => {
    const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    if (!executingSendMessage?.valuebool) {
      if (await TimeSchedule()) {
        console.log(`Buscando dados no Smart: ${date}`)
        await PersistShippingcampaign()
      }
    }
  }, await GenerateRandomTime(startTimeSendMessageRepeated, endtTimeSendMessageRepeated, '****Send Message Repeated'))

}
module.exports = { sendRepeatedMessage }
