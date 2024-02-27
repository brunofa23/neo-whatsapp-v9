//import Application from '@ioc:Adonis/Core/Application'
import Agent from 'App/Models/Agent';
//import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

//import { DateTime } from 'luxon';

//import { validAgent } from "../"
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageInternal from './SendMessageInternal';
import { ClearFolder, DateFormat, ExecutingSendMessage, GenerateRandomTime, RandomResponse, TimeSchedule, validAgent, ValidatePhone } from './util'

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode')
//const path = require('path')
//const folderPath = path.resolve(__dirname, "../../../");
//let qrcodePath


async function startAgent(_agent: Agent) {
  console.log("START AGENT 001")
  const agent = await Agent.findOrFail(_agent.id)
  if (!_agent) {
    console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents")
    return
  }
  console.log("START AGENT 002")
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: _agent.id }),
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
    console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
    agent.status = `Carregando: ${_agent.name} - ${percent} - ${message}`
    agent.save()
  });
  client.on('qr', async (qr) => {
    agent.status = "Qrcode require"
    agent.statusconnected = false
    await agent.save()

    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error('Ocorreu um erro ao gerar o URL de dados:', err);
        return;
      }
      //console.log('URL de dados do código QR:', url);
      agent.qrcode = url
      agent.save()
    });

    // qrcode.toDataURL(qr, { small: true }, (err, url) => {
    //   if (err) {
    //     console.error('Ocorreu um erro ao gerar o URL de dados:', err);
    //     return;
    //   }
    //   //console.log('URL de dados do código QR:', url);
    //   agent.qrcode = url
    //   agent.save()
    // });

    qrcodeTerminal.generate(qr, { small: true });
    //const folderPath = path.resolve(__dirname, "../../../");
    //qrcodePath = path.join(folderPath, "/qrcode", `qrcode${agent.name}.png`)
    //ClearFolder(qrcodePath)

  });


  //console.log("passei no 1500 - startAgent")
  client.on('authenticated', async () => {
    console.log(`AUTHENTICATED ${agent.name}`);
    agent.status = 'Authentication'
    agent.save()

  });


  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });



  client.on('ready', async () => {
    //ClearFolder(qrcodePath)
    console.log(`READY...${agent.name}`);
    const state = await client.getState()
    console.log("State:", state)
    console.log("INFO:", await client.info)

    await SendMessage(client, agent)
    // if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
    //   console.log("self_conversation", process.env.SELF_CONVERSATION)
    //   await SendMessageInternal(client)
    // }

    agent.status = state
    agent.statusconnected = true
    agent.number_phone = client.info.wid.user
    agent.qrcode = null
    await agent.save()

  });

  //console.log("passei no 1510 - startAgent")
  if (process.env.SERVER === 'true') {
    //console.log("chamei send repeated")
    await sendRepeatedMessage(agent)
  }

  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(client, agent)

  if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
    const chatMonitoringInternal = new ChatMonitoringInternal
    await chatMonitoringInternal.monitoring(client)
  }



  //************************************************ */
  client.on('disconnected', async (reason) => {
    agent.status = 'Disconnected'
    agent.statusconnected = false
    await agent.save()
    console.log("EXECUTANDO DISCONECT")
    console.log("REASON>>>", reason)


  });


  let rejectCalls = true;
  client.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
  });

  return client

}





module.exports = { startAgent }
