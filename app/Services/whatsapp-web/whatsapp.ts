import { sendRepeatedMessage } from '../../../app/Services/whatsapp-web/SendRepeatedMessage'

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



