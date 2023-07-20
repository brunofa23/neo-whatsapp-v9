import { sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import ChatMonitoring from '../../Services/whatsapp-web/ChatMonitoring'

async function executeWhatsapp() {

  // sendRepeatedMessage()
  // return

  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcode = require('qrcode-terminal');

  console.log("Entrei Whatsapp class")

  const client = new Client({
    authStrategy: new LocalAuth()
  });

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', async () => {
    console.log('Lendo na Inicialização!');
    //chamar função que fica rodando e disparando mensagens
    const intervalId = setInterval(() => {
      sendRepeatedMessage(client)
    }, 15000)
  });

  client.initialize();
  console.log("Inicializado")

  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(client)

}

module.exports = { executeWhatsapp }
