import { DateTime } from 'luxon';
import { Client } from 'whatsapp-web.js';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, TimeSchedule } from './util'

async function sendRepeatedMessage() {
  const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
  const startTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE)
  const endtTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END)


  if (!global.executingSendMessage) {
    if (await TimeSchedule()) {
      console.log(`Buscando dados no Smart: ${date}`)
      await PersistShippingcampaign()
    }
  }


}
module.exports = { sendRepeatedMessage }




