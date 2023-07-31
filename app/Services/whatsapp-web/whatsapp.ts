import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import Mehtods from '../../Services/whatsapp-web/ChatMonitoring/ClientMethods'
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'

async function executeWhatsapp(logout: boolean = false) {

  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');
  console.log("Entrei Whatsapp class")
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--max-memory=512MB'],
      headless: true
    }
  });

  // Change to false if you don't want to reject incoming calls
  let rejectCalls = true;
  client.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    //await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Phone call from ${call.from}, type ${call.isGroup ? 'group' : ''} ${call.isVideo ? 'video' : 'audio'} call. ${rejectCalls ? 'This call was automatically rejected by the script.' : ''}`);
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Este número de telefone está programado para não receber chamadas. `);
  });

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log(qr);
  });

  client.on('authenticated', () => {
    console.log('AUTHENTICATED');
  });

  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });


  client.on('ready', async () => {
    console.log('Lendo na Inicialização!');
    const EXECUTE_SEND_REPEATED_MESSAGE: number = process.env.EXECUTE_SEND_REPEATED_MESSAGE
    //chamar função que fica rodando e disparando mensagens
    setInterval(async () => {
      const verify = await sendRepeatedMessage(client)
    }, EXECUTE_SEND_REPEATED_MESSAGE)

  });

  client.on('disconnected', (reason) => {
    console.log("EXECUTANDO DISCONECT")
    console.log("REASON>>>", reason)
    // Destroy and reinitialize the client when disconnected
    client.destroy();
    client.initialize();
  });

  client.initialize();
  console.log("Inicializado")

  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(client)

  if (logout) {
    const execMethod = new Mehtods
    await execMethod.executeMethod(client, "logout")
  }

}

module.exports = { executeWhatsapp }
