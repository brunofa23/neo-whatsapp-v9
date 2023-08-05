import { DateTime } from 'luxon';
import { Client } from 'whatsapp-web.js';

import PersistShippingcampaign from './PersistShippingcampaign';
import { DateFormat } from './util'

async function sendRepeatedMessage(client: Client) {
  const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
  console.log(`Processo Inicializado ${date}`)

  if (!global.executingSendMessage) {
    await PersistShippingcampaign()
  }


}
module.exports = { sendRepeatedMessage }




