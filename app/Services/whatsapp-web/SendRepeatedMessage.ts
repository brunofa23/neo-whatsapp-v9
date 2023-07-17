import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'

async function sendRepeatedMessage(client) {

  //1 - Buscar os pacientes dos filtros selecionados
  const shippingCampaigns = await require('../../Controllers/Http/ShippingcampaignsController')
  console.log("BUSCA NO SMART:", await shippingCampaigns.scheduledPatients())

  //2 - Validar e filtrar os numeros válidos do Whatsapp
  //verifyNumber
  const _verifyNumber = await verifyNumber(client, shippingCampaigns)

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




