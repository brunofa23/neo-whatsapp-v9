//import ShippingcampaignsController from '../../Controllers/Http/ShippingcampaignsController';
import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'
import Shippingcampaign from 'App/Models/Shippingcampaign'

async function sendRepeatedMessage(client) {
  //1 - Buscar os pacientes dos filtros selecionados
  const Source = require('../../Controllers/Persist/Source')
  const sourceDataList = await Source.scheduledPatients()
  // console.log("BUSCA NO SMART:", await sourceData.scheduledPatients())
  //2 - Transformar para o objeto Shippingcampaigm
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



  // const _verifyNumber = await verifyNumber(client, sourceData)
  // const shippingCampaign = Shippingcampaign.all()
  // console.log("shippingCampaign", shippingCampaign)


  //const teste = require('../../Controllers/Http/TestesController')
  //console.log("BUSCA NO SMART:", await teste.scheduledPatients())


  //const shipping = require('../../Controllers/Http/TestesController')
  //console.log("SHIPPING:::", await shipping.Shipping())
  // try {

  //   await shipping.store2()
  //   //console.log("gravado com sucesso")
  // } catch (error) {
  //   //console.log("erorrrrr:", error)
  // }

  // const shipping1 = require('../../Models/Shippingcampaign')
  // console.log("SHIPPING 111:::", await shipping1.all())




  //const message = 'Olá, gostaria de confirmar seu agendamento? \nSim\nNão'; // Mensagem a ser enviada
  //const listPacToSendMessage = await verifyNumber(client)
  //console.log("LISTA DE PACIENTES PARA ENVIAR:::", listPacToSendMessage)


  // client.sendMessage(phoneNumber, message).then((response) => {
  //   console.log('Message sent successfully!');
  //   return true
  // }).catch((error) => {
  //   console.error('Failed to send message:', error);
  //   return false
  // });

}
module.exports = { sendRepeatedMessage }




