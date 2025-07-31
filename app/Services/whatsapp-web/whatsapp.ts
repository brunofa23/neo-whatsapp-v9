<<<<<<< HEAD
import Agent from 'App/Models/Agent';
//import Shippingcampaign from 'App/Models/Shippingcampaign';
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
//import SendMessageAgentDefault from './SendMessageAgentDefault';
import Customchat from 'App/Models/Customchat';
import Application from '@ioc:Adonis/Core/Application'
import WhatsAppClientManager from './WhatsAppClientManager';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode')

async function startAgentChat(_agent: Agent) {
  const agent = await Agent.findOrFail(_agent.id)
  if (!_agent) {
    console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents")
    return
  }

  const clientChat = new Client({
    //authStrategy: new LocalAuth({ clientId: _agent.id }),
    authStrategy: new LocalAuth({ clientId: _agent.id, dataPath: Application.tmpPath('/sessions') }),
    puppeteer: {
      //executablePath: '/usr/bin/chromium-browser',
      //executablePath: '/usr/bin/google-chrome',
      executablePath: '/snap/bin/chromium',
      args: ['--no-sandbox',
=======
import Application from '@ioc:Adonis/Core/Application'
import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
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
>>>>>>> development
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


<<<<<<< HEAD
  clientChat.initialize();
  clientChat.on('loading_screen', (percent, message) => {
    console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
  });
=======
  client.initialize();
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
>>>>>>> development


  clientChat.on('qr', async (qr) => {
    agent.status = "Qrcode require"
    agent.statusconnected = false
    await agent.save()
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error('Ocorreu um erro ao gerar o URL de dados:', err);
        return;
      }
      agent.qrcode = url
      agent.save()
    });
    qrcodeTerminal.generate(qr, { small: true });

<<<<<<< HEAD
  });

  clientChat.on('authenticated', () => {
    console.log(`AUTHENTICATED ${agent.name}`);
    agent.status = 'Authentication'
    agent.save()
  });


  clientChat.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });

  await clientChat.on('ready', async () => {
    console.log(`READY...${agent.name}`);
    const state = await clientChat.getState()
    console.log("State:", state)
    console.log("INFO:", await clientChat.info)
    //await SendMessageAgentDefault(clientChat, agent)
    agent.status = state
    agent.statusconnected = true
    agent.number_phone = clientChat.info.wid.user
    agent.qrcode = null
=======
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
    console.log('READY...');
    const state = await client.getState()
    console.log("State:", state)
    await SendMessage(client)

    if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
      console.log("self_conversation", process.env.SELF_CONVERSATION)
      await SendMessageInternal(client)
    }

    agent.status = state
>>>>>>> development
    await agent.save()

  });

<<<<<<< HEAD
  clientChat.on('message_ack', async (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */
    const returnAck = await Customchat.query()
      .where('message', msg.body)
      .andWhere('cellphoneserialized', msg.to)
      .update({ ack: msg.ack })
  });

  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(clientChat)

  if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
    const chatMonitoringInternal = new ChatMonitoringInternal
    await chatMonitoringInternal.monitoring(clientChat)
  }
  //************************************************ */
  clientChat.on('disconnected', async (reason) => {
    try {
      agent.status = 'Disconnected'
      agent.statusconnected = false
      await agent.save()
    } catch (error) {

    }
    console.log("EXECUTANDO DISCONECT")
    console.log("REASON>>>", reason)
    return
  });

  WhatsAppClientManager.addClient(agent.id.toString(), clientChat);

  let rejectCalls = true;
  clientChat.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await clientChat.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
  });
  return clientChat
}
export { startAgentChat }
=======

  sendRepeatedMessage()
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
>>>>>>> development
