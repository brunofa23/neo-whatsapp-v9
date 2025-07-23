import Agent from 'App/Models/Agent';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';
import { DateTime } from 'luxon';
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageInternal from './SendMessageInternal';
import { GenerateRandomTime } from './util'
import Chat from 'App/Models/Chat';
import Application from '@ioc:Adonis/Core/Application'
import WhatsAppClientManager from './WhatsAppClientManager';
import Talk from 'App/Models/Talk';


// Caminhos de sessão e perfil do Chrome

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode')

async function getStatusSendMessage() {
  const result = await Config.query().select('valuebool', 'valuedatetime').where('id', 'statusSendMessage').first()
  const dateNow = DateTime.now();
  const dateConfig = DateTime.fromJSDate(result?.$attributes.valuedatetime);
  const diffMinutes = dateNow.diff(dateConfig).as('minutes');

  if (result?.$attributes.valuebool == 1 && diffMinutes > 5)
    return true
  else return false
}


async function startAgent(_agent: Agent) {
  console.log("whatsappConnections.....")
  //const chromeProfilePath = Application.tmpPath(`chrome-profiles/${_agent.id}`);
  // Garante que os diretórios existem
  //fs.mkdirSync(chromeProfilePath, { recursive: true });

  const agent = await Agent.findOrFail(_agent.id)
  if (!_agent) {
    console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents")
    return
  }
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: _agent.id, dataPath: Application.tmpPath('/sessions') }),
    //authStrategy: new LocalAuth({ clientId: _agent.id }),
    puppeteer: {
      executablePath: '/snap/bin/chromium',
      args: ['--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        //`--user-data-dir=${Application.tmpPath('/chrome-profiles/' + _agent.id)}`
      ],
      //dumpio: false,
      headless: true,
      setRequestInterception: true,
      setBypassCSP: true,
      setJavaScriptEnabled: false
    }

  });


  client.initialize();
  client.on('loading_screen', (percent, message) => {
    console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
    //agent.status = `Carregando: ${_agent.name} - ${percent} - ${message}`
    //agent.save()
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

  await client.on('authenticated', async () => {
    console.log(`AUTHENTICATED ${agent.name}`);
    agent.status = 'Authentication'
    agent.statusconnected = true
    agent.number_phone = client.info?.wid?.user || null
    agent.qrcode = null
    agent.save()
  });

  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });

  await client.on('ready', async () => {
    console.log(`READY...${agent.name}`);
    const state = await client.getState()
    console.log("State:", state)
    const infoClient = await client.info
    console.log("Client:", infoClient.pushname, "- Phone number:", infoClient.wid.user)
    agent.status = state
    agent.statusconnected = true
    agent.number_phone = client.info.wid.user
    agent.qrcode = null
    await agent.save()

    //CÓDIGO QUE PEGA TODAS AS CONVERSAS QUANDO DESCONECTADO
    // try {
    //   // Obtém todos os chats
    //   const chats = await client.getChats();

    //   for (const chat of chats) {
    //     console.log(`Chat encontrado: ${chat.name || chat.id.user}`);

    //     // Obtém as últimas 5 mensagens do chat
    //     const messages = await chat.fetchMessages({ limit: 1 });

    //     console.log(`Mensagens do chat "${chat.name || chat.id.user}":`);
    //     for (const message of messages) {
    //       console.log(`- ${message.fromMe ? 'Você' : 'Contato'}: ${message.body}`);
    //     }
    //   }
    // } catch (error) {
    //   console.error('Erro ao acessar chats ou mensagens:', error);
    // }


  });

  const startTimeSendMessage = agent.interval_init_message
  const endTimeSendMessage = agent.interval_final_message
  setInterval(async () => {
    const statusSendMessage = await getStatusSendMessage()//await Config.query().select('valuebool', 'valuedatetime').where('id', 'statusSendMessage').first()
    if (statusSendMessage) {
      SendMessage(client, agent)
    }
  }, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))


  setInterval(async () => {
    const statusSendMessage = await getStatusSendMessage() //Config.query().select('valuebool', 'valuedatetime').where('id', 'statusSendMessage').first()
    if (statusSendMessage) {
      if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
        await SendMessageInternal(client)
      }
    }
  }, await GenerateRandomTime(600, 800, '----Time Send Message'))


  const chatMonitoring = new ChatMonitoring
  await chatMonitoring.monitoring(client, agent)

  if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
    const chatMonitoringInternal = new ChatMonitoringInternal
    await chatMonitoringInternal.monitoring(client)
  }


  client.on('message_ack', async (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */
    // console.log("ack:",ack)
    // console.log("MENSAGEM>>>>>", msg)
    if (ack >= 2) {
      await Chat.query()
        .where('message', msg.body)
        .andWhere('cellphoneserialized', msg.to)
        .andWhere('chatnumber', 'like', String(msg.from).replace(/\D/g, ''))
        .update({ ack: msg.ack })

        await Talk.query()
        .where('message', msg.body)
        .andWhere('cellphoneserialized', msg.to)
        .andWhere('chatnumber', 'like', String(msg.from).replace(/\D/g, ''))
        .update({ message_ack: msg.ack })
    }
  });



  //************************************************ */
  client.on('disconnected', async (reason) => {
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

  WhatsAppClientManager.addClient(agent.id.toString(), client);
  console.log("150011>>>>>>", WhatsAppClientManager)

  let rejectCalls = true;
  client.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
  });
  return client
}
export { startAgent }
