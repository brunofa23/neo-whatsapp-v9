import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'

async function sendRepeatedMessage(client) {
  //1 - Buscar os pacientes dos filtros selecionados
  const dataSource = new DatasourcesController
  const dataSourceList = await dataSource.scheduledPatients()

  //2 - Transformar para o objeto Shippingcampaigm
  let shippingCampaignList = []
  for (let shippingCampaign of dataSourceList) {
    const firstName = shippingCampaign.pac_nome.split(" ")
    const dataRow = new Shippingcampaign()
    dataRow.name = shippingCampaign.pac_nome.trim()
    dataRow.cellphone = shippingCampaign.pac_celular
    dataRow.message = `Olá ${firstName[0]}, somos da Neo, gostariamos de confirmar agendamento para o dia ${shippingCampaign.data_agm.trim()} com o Dr(a).${shippingCampaign.psv_nome.trim()} \n1-Sim 2-Não `
    shippingCampaignList.push(dataRow)
  }

  //3 - Validar e filtrar os numeros válidos do Whatsapp
  //verifyNumber
  for (let dataRow of shippingCampaignList) {
    dataRow.cellphoneserialized = await verifyNumber(client, dataRow.cellphone)
    dataRow.phonevalid = (dataRow.cellphone == null || dataRow.cellphone == undefined) ? false : true
    dataRow.messagesent = false
  }

  //4 - Enviar a mensagem...
  for (const dataRow of shippingCampaignList) {
    try {
      if (dataRow.phonevalid && !dataRow.messagesent) {
        const send = client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
        dataRow.messagesent = true
      }
    } catch (error) {
      console.log("ERRO:::", error)
    }
  }
  console.log("LISTA ENVIADA::", shippingCampaignList)


}
module.exports = { sendRepeatedMessage }




