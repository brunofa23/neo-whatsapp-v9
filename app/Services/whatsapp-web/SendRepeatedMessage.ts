import { DateTime } from 'luxon';
import { Client } from 'whatsapp-web.js';

import PersistShippingcampaign from './PersistShippingcampaign';
import PersistValidationPhones from './PersistValidationPhones';
import SendMessage from './SendMessage';
import { DateFormat } from './util'

async function sendRepeatedMessage(client: Client) {
  const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
  console.log(`Processo Inicial ${date}`)
  if (!global.executingSendMessage) {
    //1 - Insere na tabela as informações que buscou no Smart
    await PersistShippingcampaign()
    //2 - Verifica os números válidos e persiste na tabela
    const shippingCampaignList = await PersistValidationPhones(client)
    //3 - Envia as mensagens e persiste na tabela chat
    await SendMessage(client, shippingCampaignList)
  }
  console.log(`Processo final ${date}`)

}
module.exports = { sendRepeatedMessage }




