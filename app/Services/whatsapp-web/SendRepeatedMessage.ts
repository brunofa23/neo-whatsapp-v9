
import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'
const Teste = require('../../Controllers/Http/TestesController')


async function sendRepeatedMessage(client) {

  const _teste = Teste.teste()
  //await Database.connection('mssql').from('pac').select('*').where('pac_reg', '=', '15')
  //console.log("TESTE>>>", teste.name())
  //1 - Buscar os pacientes dos filtros selecionados
  const ListadePacientes = pacList()
  console.log("ListadePacientes?????????", ListadePacientes)
  //return (await Database.connection('mssql').from('pac').select('*').where('pac_reg', '=', '15'))


  //2 - Validar e filtrar os numeros válidos do Whatsapp
  //verifyNumber

  const message = 'Olá, gostaria de confirmar seu agendamento? \nSim\nNão'; // Mensagem a ser enviada
  const listPacToSendMessage = await verifyNumber(client)
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




