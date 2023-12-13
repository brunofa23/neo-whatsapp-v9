import Application from '@ioc:Adonis/Core/Application'
import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
//import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
import { DateTime } from 'luxon';

import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageInternal from './SendMessageInternal';
import { ClearFolder, DateFormat, ExecutingSendMessage, GenerateRandomTime, RandomResponse, TimeSchedule, ValidatePhone } from './util'

async function executeWhatsapp() {


  const agent = await Agent.findBy('name', process.env.CHAT_NAME)
  if (!agent || agent == undefined) {
    console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents")
    return
  }

  const { Client, LocalAuth } = require('whatsapp-web.js');
  const qrcodeTerminal = require('qrcode-terminal');
  const qrcode = require('qrcode')
  const path = require('path')

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'Digi3' }),
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

  console.log("Entrei no class whatsapp")

  client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
  });

  client.on('qr', async (qr) => {

    agent.status = "Qrcode require"
    await agent.save()

    setTimeout(() => {

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

    }, 5000);



    qrcode.toDataURL(qr, { small: true }, (err, url) => {
      if (err) {
        console.error('Ocorreu um erro ao gerar o URL de dados:', err);
        return;
      }
      //console.log('URL de dados do código QR:', url);
      // Você pode usar o URL de dados (data URL) aqui conforme necessário
    });

    setTimeout(() => {
      console.clear(); // Limpa o terminal
    }, 50000);

  });


  client.on('authenticated', () => {
    console.log('AUTHENTICATED');
    agent.status = 'Authenticated'
    agent.save()
  });

  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
    agent.status = 'Authentication Failure'
    agent.save()
  });

  await client.on('ready', async () => {

    console.log("RASTREAMENTO 1001>>>>>>>>>>>>>>>>>")

    console.log('READY...');
    const state = await client.getState()
    console.log("State:", state)
    await SendMessage(client)

    if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
      console.log("self_conversation", process.env.SELF_CONVERSATION)
      SendMessageInternal(client)
    }

    agent.status = state
    await agent.save()

  });



  //await sendRepeatedMessage()
  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(client)

  if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
    const chatMonitoringInternal = new ChatMonitoringInternal
    await chatMonitoringInternal.monitoring(client)
  }

  //************************************************ */

  client.on('disconnected', async (reason) => {
    console.log("EXECUTANDO DISCONECT")
    console.log("REASON>>>", reason)

    agent.status = 'Disconnected - banned'
    await agent.save()
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
