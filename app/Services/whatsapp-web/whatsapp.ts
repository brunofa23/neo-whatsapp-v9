import Agent from 'App/Models/Agent';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageAgentDefault from './SendMessageAgentDefault';
import Customchat from 'App/Models/Customchat';

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


  clientChat.initialize();
  clientChat.on('loading_screen', (percent, message) => {
    console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
  });


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
    await SendMessageAgentDefault(clientChat, agent)
    agent.status = state
    agent.statusconnected = true
    agent.number_phone = clientChat.info.wid.user
    agent.qrcode = null
    await agent.save()

  });

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
    agent.status = 'Disconnected'
    agent.statusconnected = false
    await agent.save()
    await Shippingcampaign.create({
      interaction_id: 3,
      interaction_seq: 1,
      message: `O agente ${agent.number_phone} foi desconectado!`,
      cellphone: '31985228619',
      reg: 1,
      name: 'Bruno',
      prioritysend: true
    })
    console.log("EXECUTANDO DISCONECT")
    console.log("REASON>>>", reason)
    return
  });


  let rejectCalls = true;
  clientChat.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await clientChat.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
  });
  return clientChat
}
module.exports = { startAgentChat }
