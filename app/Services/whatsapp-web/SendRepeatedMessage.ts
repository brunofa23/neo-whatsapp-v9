import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, GenerateRandomTime, TimeSchedule } from './util'
import Config from 'App/Models/Config';
import { DateTime } from 'luxon';

async function sendRepeatedMessage() {
  const startTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE)
  const endtTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END)
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




