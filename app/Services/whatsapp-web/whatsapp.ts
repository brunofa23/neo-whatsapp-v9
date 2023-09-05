import Application from '@ioc:Adonis/Core/Application'
import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
import { DateTime } from 'luxon';

import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageInternal from './SendMessageInternal';
import { ClearFolder, DateFormat, ExecutingSendMessage, GenerateRandomTime, TimeSchedule, ValidatePhone } from './util'

async function executeWhatsapp() {


  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcodeTerminal = require('qrcode-terminal');
  const qrcode = require('qrcode')
  const path = require('path')

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox',
        '--max-memory=512MB',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      headless: true,
      setRequestInterception: true,
      setBypassCSP: true,
      setJavaScriptEnabled: false
    }
  });


  client.initialize();

  client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);

  });

  client.on('qr', (qr) => {

    qrcodeTerminal.generate(qr, { small: true });

    const folderPath = path.resolve(__dirname, "../../../");
    const qrcodePath = path.join(folderPath, "/qrcode", 'qrcode.png')
    ClearFolder(qrcodePath)
    qrcode.toFile(qrcodePath, qr, { small: true }, (err) => {
      if (err) {
        console.error('Ocorreu um erro ao gerar o arquivo do código QR:', err);
        return;
      }
      console.log('Arquivo do código QR foi gerado com sucesso:');
    });

    // qrcode.toDataURL(qr, { small: true }, (err, url) => {
    //   if (err) {
    //     console.error('Ocorreu um erro ao gerar o URL de dados:', err);
    //     return;
    //   }
    //   console.log('URL de dados do código QR:', url);
    //   // Você pode usar o URL de dados (data URL) aqui conforme necessário
    // });

    // setTimeout(() => {
    //   console.clear(); // Limpa o terminal
    // }, 50000);

  });

  client.on('authenticated', () => {
    console.log('AUTHENTICATED');
  });

  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });

  await client.on('ready', async () => {
    console.log('READY...');
    const state = await client.getState()
    console.log("State:", state)
    await SendMessage(client)

    if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
      console.log("self_conversation", process.env.SELF_CONVERSATION)
      await SendMessageInternal(client)
    }

  });


  await sendRepeatedMessage()
  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(client)

  if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
    const chatMonitoringInternal = new ChatMonitoringInternal
    await chatMonitoringInternal.monitoring(client)
  }

  //************************************************ */

  client.on('disconnected', (reason) => {
    console.log("EXECUTANDO DISCONECT")
    console.log("REASON>>>", reason)
    // Destroy and reinitialize the client when disconnected
    client.destroy();
    client.initialize();
  });


  let rejectCalls = true;
  client.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Este número de telefone está programado para não receber chamadas. `);
  });



}

module.exports = { executeWhatsapp }
