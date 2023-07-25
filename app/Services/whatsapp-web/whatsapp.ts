import { sendRepeatedMessage, logout } from 'App/Services/whatsapp-web/SendRepeatedMessage';

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

  client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log(qr);
  });

  client.on('ready', async () => {
    console.log('Lendo na Inicialização!');
    //chamar função que fica rodando e disparando mensagens
    const intervalId = setInterval(() => {
      sendRepeatedMessage(client)
    }, 15000)
  });


  if (logout) {

    // client.on('disconnected', (reason) => {
    //   console.log("EXECUTANDO DISCONECT")
    //   console.log("REASON>>>", reason)
    //   // Destroy and reinitialize the client when disconnected
    client.destroy();
    client.initialize();

    // });
  }


  client.initialize();
  console.log("Inicializado")

  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(client)





}

module.exports = { executeWhatsapp }
