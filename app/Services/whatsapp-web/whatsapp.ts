import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringAgentChat from './ChatMonitoring/ChatMonitoringAgentChat'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageAgentDefault from './SendMessageAgentDefault';
import SendMessageInternal from './SendMessageInternal';
import { ClearFolder, DateFormat, ExecutingSendMessage, GenerateRandomTime, RandomResponse, TimeSchedule, validAgent, ValidatePhone } from './util'
import Agent from 'App/Models/Agent';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode')
const path = require('path')
const folderPath = path.resolve(__dirname, "../../../");
let qrcodePath


async function startAgentChat(_agent: Agent) {
  const agent = await Agent.findOrFail(_agent.id)

  if (!_agent) {
    console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents")
    return
  }

  const clientChat = new Client({
    authStrategy: new LocalAuth({ clientId: _agent.name }),
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


  //console.log("passei no 1501 - startAgent", agent.name)
  clientChat.initialize();
  clientChat.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
    agent.status = `Carregando ${percent} - ${message}`
    agent.save()
  });


  clientChat.on('qr', async (qr) => {

    agent.status = "Qrcode require"
    agent.statusconnected = false
    await agent.save()

    qrcode.toDataURL(qr, { small: true }, (err, url) => {
      if (err) {
        console.error('Ocorreu um erro ao gerar o URL de dados:', err);
        return;
      }
      //console.log('URL de dados do código QR:', url);
      agent.qrcode = url
      agent.save()
    });

    qrcodeTerminal.generate(qr, { small: true });
    const folderPath = path.resolve(__dirname, "../../../");
    qrcodePath = path.join(folderPath, "/qrcode", `qrcode${agent.name}.png`)
    ClearFolder(qrcodePath)
  });


  //console.log("passei no 1500 - startAgent")
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
    ClearFolder(qrcodePath)
    console.log(`READY...${agent.name}`);
    const state = await clientChat.getState()
    console.log("State:", state)
    console.log("INFO:", await clientChat.info)

    await SendMessageAgentDefault(clientChat, agent)

    // if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
    //   console.log("self_conversation", process.env.SELF_CONVERSATION)
    //   await SendMessageInternal(clientChat)
    // }

    agent.status = state
    agent.statusconnected = true
    agent.number_phone = clientChat.info.wid.user
    agent.qrcode = null
    await agent.save()

  });

  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(clientChat)

  if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
    const chatMonitoringInternal = new ChatMonitoringInternal
    await chatMonitoringInternal.monitoring(clientChat)
  }



  //************************************************ */
  clientChat.on('disconnected', async (reason) => {
    console.log("EXECUTANDO DISCONECT")
    console.log("REASON>>>", reason)
    agent.status = 'Disconnected'
    agent.statusconnected = false
    await agent.save()

  });


  let rejectCalls = true;
  clientChat.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await clientChat.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Este número de telefone está programado para não receber chamadas. `);
  });


  return clientChat

}





module.exports = { startAgentChat }
