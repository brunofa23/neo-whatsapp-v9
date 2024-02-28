import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { logout, sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
import { DateTime, DatetTime } from 'luxon';
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageInternal from './SendMessageInternal';
import { ClearFolder, DateFormat, ExecutingSendMessage, GenerateRandomTime, RandomResponse, TimeSchedule, validAgent, ValidatePhone } from './util'

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode')


async function getStatusSendMessage() {
  const result = await Config.query().select('valuebool', 'valuedatetime').where('id', 'statusSendMessage').first()
  const dateNow = DateTime.now();
  const dateConfig = DateTime.fromJSDate(result?.$attributes.valuedatetime);
  const diffMinutes = dateNow.diff(dateConfig).as('minutes');

  if (result?.$attributes.valuebool == 1 && diffMinutes > 7)
    return true
  else return false
}


async function startAgent(_agent: Agent) {

  const agent = await Agent.findOrFail(_agent.id)
  if (!_agent) {
    console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents")
    return
  }
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
    qrcodeTerminal.generate(qr, { small: true });
  });

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
    console.log(`READY...${agent.name}`);
    const state = await client.getState()
    console.log("State:", state)
    console.log("INFO:", await client.info)

    // setInterval(() => {
    //   SendMessage(client, agent)
    // }, 10000)
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


  const startTimeSendMessage = agent.interval_init_message
  const endTimeSendMessage = agent.interval_final_message
  const sendMessage = setInterval(async () => {
    const statusSendMessage = await getStatusSendMessage()//await Config.query().select('valuebool', 'valuedatetime').where('id', 'statusSendMessage').first()
    if (statusSendMessage) {

      SendMessage(client, agent)
    }
  }, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))


  const sendMessageInternal = setInterval(async () => {
    const statusSendMessage = await getStatusSendMessage() //Config.query().select('valuebool', 'valuedatetime').where('id', 'statusSendMessage').first()
    if (statusSendMessage) {
      if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
        console.log("self_conversation", process.env.SELF_CONVERSATION)
        await SendMessageInternal(client)
      }
    }
  }, 25000)



  if (process.env.SERVER === 'true') {
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
