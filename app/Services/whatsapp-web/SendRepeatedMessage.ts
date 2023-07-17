//import ShippingcampaignsController from '../../Controllers/Http/ShippingcampaignsController';
import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'
import Shippingcampaign from 'App/Models/Shippingcampaign'


async function sendRepeatedMessage(client) {
  //1 - Buscar os pacientes dos filtros selecionados
  const Source = require('../../Controllers/Persist/Source')
  const sourceDataList = await Source.scheduledPatients()
  //2 - Transformar para o objeto Shippingcampaigm
  const teste = await Shippingcampaign.all()

  let shippingCampaignList = []
  for (let shippingCampaign of sourceDataList) {
    const dataRow = {
      name: shippingCampaign.pac_nome,
      cellphone: shippingCampaign.pac_celular,
      message: "Olá, somos da Neo, gostariamos de confirmar agendament..."
    }
    shippingCampaignList.push(dataRow)
  }

  //2 - Validar e filtrar os numeros válidos do Whatsapp
  //verifyNumber
  for (let dataRow of shippingCampaignList) {
    const firstName = dataRow.name.split(" ")
    dataRow.name = firstName[0]
    dataRow.phonevalid = (dataRow.cellphone == null || dataRow.cellphone == undefined) ? false : await verifyNumber(client, dataRow.cellphone)
  }
  console.log("SHIPPING CAMPAIGN LIST:", shippingCampaignList)



}
module.exports = { sendRepeatedMessage }




