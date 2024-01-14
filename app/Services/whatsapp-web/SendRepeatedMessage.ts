import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import { DateTime } from 'luxon';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage(agent: Agent) {
  const executingSendMessage = await Config.find('executingSendMessage')
  setInterval(async () => {
    const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    if (!executingSendMessage?.valuebool) {
      if (await TimeSchedule()) {
        console.log(`Buscando dados no Smart: ${date}`)
        await PersistShippingcampaign()
      }
    }
  }, await GenerateRandomTime(500, 800, '****Send Message Repeated'))

}
module.exports = { sendRepeatedMessage }
