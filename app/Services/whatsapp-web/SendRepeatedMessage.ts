import PersistShippingcampaign from './PersistShippingcampaign';
import PersistValidationPhones from './PersistValidationPhones';
import SendMessage from './SendMessage';
import { Client } from 'whatsapp-web.js';

async function sendRepeatedMessage(client: Client) {

  console.log("Verificando se tem novos envios...")
  //1 - Insere na tabela as informações que buscou no Smart
  await PersistShippingcampaign()
  //2 - Verifica os números válidos e persiste na tabela
  const shippingCampaignList = await PersistValidationPhones(client)
  //3 - Envia as mensagens e persiste na tabela chat
  await SendMessage(client, shippingCampaignList)

}
module.exports = { sendRepeatedMessage }




