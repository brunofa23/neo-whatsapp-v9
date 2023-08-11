import { DateTime } from 'luxon';
import { Client } from 'whatsapp-web.js';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat, TimeSchedule } from './util'

async function sendRepeatedMessage(client: Client) {
  const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())


  if (!global.executingSendMessage) {
    if (await TimeSchedule()) {
      console.log(`Buscando dados no Smart: ${date}`)
      await PersistShippingcampaign()
    }

  }


}
module.exports = { sendRepeatedMessage }




