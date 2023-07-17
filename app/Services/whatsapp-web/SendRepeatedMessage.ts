import { Shipping } from 'App/Controllers/Http/TestesController';
import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import shipping from 'App/Controllers/Http/TestesController'

async function sendRepeatedMessage(client) {

  //const shipping = await require('../../Controllers/Http/TestesController')
  //console.log("SHIPPING:::", await shipping.Shipping())

  //const shipping = require('../../Controllers/Http/TestesController')
  try {
    await shipping.store()
    console.log("gravado com sucesso")
  } catch (error) {
    console.log("erorrrrr:", error)
  }


  //const shipping1 = require('../../Models/Shippingcampaign')
  //console.log("SHIPPING 111:::", await shipping1.all())

  //1 - Buscar os pacientes dos filtros selecionados
  //const shippingCampaigns = await require('../../Controllers/Http/ShippingcampaignsController')
  //console.log("BUSCA NO SMART:", await shippingCampaigns.scheduledPatients())

  //2 - Validar e filtrar os numeros válidos do Whatsapp
  //verifyNumber
  //const _verifyNumber = await verifyNumber(client, shippingCampaigns)
  //  const shippingCampaign = Shippingcampaign.all()
  //  console.log("shippingCampaign", shippingCampaign)

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




