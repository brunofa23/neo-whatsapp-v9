import { DateTime } from 'luxon';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage() {
  const startTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE)
  const endtTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END)
  setInterval(async () => {
    const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    if (!global.executingSendMessage) {
      if (await TimeSchedule()) {
        console.log(`Buscando dados no Smart: ${date}`)
        await PersistShippingcampaign()
      }
    }
  }, await GenerateRandomTime(startTimeSendMessageRepeated, endtTimeSendMessageRepeated, '****Send Message Repeated'))

}
module.exports = { sendRepeatedMessage }




