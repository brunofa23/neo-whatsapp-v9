import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
import { DateTime } from 'luxon';

import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import { DateFormat, ExecutingSendMessage, GenerateRandomTime } from './util'
import { Application } from '@adonisjs/core/build/standalone';

async function executeWhatsapp() {

  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcodeTerminal = require('qrcode-terminal');
  const qrcode = require('qrcode')

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
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Este número de telefone está programado para não receber chamadas. `);
  });

  client.on('qr', (qr) => {
    qrcodeTerminal.generate(qr, { small: true });



    // qrcode.toDataURL(qr, { small: true }, (err, url) => {
    //   if (err) {
    //     console.error('Ocorreu um erro ao gerar o URL de dados:', err);
    //     return;
    //   }
    //   console.log('URL de dados do código QR:', url);
    //   // Você pode usar o URL de dados (data URL) aqui conforme necessário
    // });

    qrcode.toFile('C:/Users/Notebook-Bruno/OneDrive/Desktop/projetosNode/neo-whatsapp-v9/temptest/qrcode.png', qr, { small: true }, (err) => {
      if (err) {
        console.error('Ocorreu um erro ao gerar o arquivo do código QR:', err);
        return;
      }
      console.log('Arquivo do código QR foi gerado com sucesso:');
    });


    setTimeout(() => {
      console.clear(); // Limpa o terminal
    }, 50000);

  });

  client.on('authenticated', () => {
    console.log('AUTHENTICATED');
  });

  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });

  await sendRepeatedMessage()
  //await ExecutingSendMessage(false)
  client.on('ready', async () => {
    console.log('Lendo na Inicialização!');
    await SendMessage(client)

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
