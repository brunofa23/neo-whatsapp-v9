import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'

async function sendRepeatedMessage(client) {
  //1 - Buscar os pacientes dos filtros selecionados
  const dataSource = new DatasourcesController
  const dataSourceList = await dataSource.scheduledPatients()

  //2 - Transformar para o objeto Shippingcampaigm
  let shippingCampaignList = []//new Shippingcampaign()
  for (let shippingCampaign of dataSourceList) {
    const firstName = shippingCampaign.pac_nome.split(" ")
    const dataRow = {
      name: shippingCampaign.pac_nome.trim(),
      cellphone: shippingCampaign.pac_celular,
      message: `Olá ${firstName[0]}, somos da Neo, gostariamos de confirmar agendamento para o dia ${shippingCampaign.data_agm.trim()} com o Dr(a).${shippingCampaign.psv_nome.trim()} \n1-Sim 2-Não `
    }
    shippingCampaignList.push(dataRow)
  }

  //console.log("SHIPPING CAMPAIGN LIST:", shippingCampaignList)
  //3 - Validar e filtrar os numeros válidos do Whatsapp
  //verifyNumber
  for (let dataRow of shippingCampaignList) {
    dataRow.cellphone = await verifyNumber(client, dataRow.cellphone)
    dataRow.phonevalid = (dataRow.cellphone == null || dataRow.cellphone == undefined) ? false : true
    dataRow.messagesent = false
  }
  //console.log("SHIPPING CAMPAIGN LIST:", shippingCampaignList)

  //4 - Enviar a mensagem...
  //const send = await client.sendMessage(shippingCampaignList[0].cellphone, shippingCampaignList[0].message)
  // try {
  //   const send = client.sendMessage("553185228619@c.us", "Teste de envio, .....")
  //   console.log("SEND:::", send, "fone", shippingCampaignList[0].cellphone, "message", shippingCampaignList[0].message)
  // } catch (error) {
  //   console.log("ERRRO::", error)
  // }
  for (const dataRow of shippingCampaignList) {
    try {
      if (dataRow.phonevalid && !dataRow.messagesent) {
        const send = client.sendMessage(dataRow.cellphone, dataRow.message)
        dataRow.messagesent = true
      }
    } catch (error) {
      console.log("ERRO:::", error)
    }
  }

  console.log("LISTA ENVIADA::", shippingCampaignList)


}
module.exports = { sendRepeatedMessage }




