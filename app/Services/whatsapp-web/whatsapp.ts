import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'

import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import { GenerateRandomTime } from './util'
async function executeWhatsapp() {

  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--max-memory=512MB'],
      headless: true,
      setRequestInterception: true,
      setBypassCSP: true,
      setJavaScriptEnabled: false
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

    //chamar função que fica rodando e disparando mensagens
    setInterval(async () => {
      await sendRepeatedMessage(client)
    }, await GenerateRandomTime(2000, 5000))


    setInterval(async () => {
      console.log("Executando ENVIO DE MENSAGEM 787...")
      //Envia as mensagens e persiste na tabela chat
      if (!global.executingSendMessage) {
        await SendMessage(client)
      }
    }, await GenerateRandomTime(1000, 2000))

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


}

module.exports = { executeWhatsapp }
