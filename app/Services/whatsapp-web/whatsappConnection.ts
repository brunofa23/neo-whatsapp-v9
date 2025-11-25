import Agent from 'App/Models/Agent';
import Config from 'App/Models/Config';
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { DateTime } from 'luxon';
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageInternal from './SendMessageInternal';
import { GenerateRandomTime, sendMessageWarning } from './util'
import Chat from 'App/Models/Chat';
import Application from '@ioc:Adonis/Core/Application'
import WhatsAppClientManager from './WhatsAppClientManager';
import Talk from 'App/Models/Talk';
import Log from 'App/Models/Log';


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
    authStrategy: new LocalAuth({
      clientId: _agent.id,
      dataPath: Application.tmpPath('/sessions')
    }),
    puppeteer: {
      executablePath: '/snap/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      headless: true,
      dumpio: false,
      setJavaScriptEnabled: true
    },
    webVersion: '2.3000.1026075099-alpha',
    webVersionPath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1026075099-alpha.html'
  });

  // const client = new Client({
  //   authStrategy: new LocalAuth({
  //     clientId: _agent.id,
  //     dataPath: Application.tmpPath('/sessions')
  //   }),
  //   puppeteer: {
  //     executablePath: '/snap/bin/chromium',
  //     args: [
  //       '--no-sandbox',
  //       '--disable-setuid-sandbox',
  //       '--disable-dev-shm-usage',
  //       '--disable-accelerated-2d-canvas',
  //       '--no-first-run',
  //       '--no-zygote',
  //       '--disable-gpu'
  //     ],
  //     headless: true,
  //     setRequestInterception: true,
  //     setBypassCSP: true,
  //     setJavaScriptEnabled: false
  //   },

  // });


  client.initialize();
  client.on('loading_screen', (percent, message) => {
    console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
    //agent.status = `Carregando: ${_agent.name} - ${percent} - ${message}`
    //agent.save()
  });

  client.on('qr', async (qr) => {
    try {
      // Atualiza status inicial
      agent.status = "Qrcode require";
      agent.statusconnected = false;
      await agent.save();

      // Converte o QR em URL
      const url = await new Promise((resolve, reject) => {
        qrcode.toDataURL(qr, (err, url) => {
          if (err) return reject(err);
          resolve(url);
        });
      });

      // Atualiza o QRCode na tabela
      agent.qrcode = url;
      await agent.save();

      // Exibe no terminal
      qrcodeTerminal.generate(qr, { small: true });
    } catch (error) {
      console.error('Erro ao processar QR code:', error);
    }
  });

  client.on('authenticated', async () => {
    try {
      console.log(`AUTHENTICATED ${agent.name}`);
      agent.status = 'Authentication';
      agent.statusconnected = true;
      agent.number_phone = client.info?.wid?.user || null;
      agent.qrcode = null;

      await agent.save();
    } catch (error) {
      console.error('Erro ao atualizar agente após autenticação:', error);
    }
  });




  client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
  });

  client.on('ready', async () => {
    try {
      console.log(`READY... ${agent.name}`);

      const state = await client.getState();
      console.log("State:", state);

      const infoClient = await client.info;
      console.log("Client:", infoClient.pushname, "- Phone number:", infoClient.wid?.user);

      // Atualiza status do agente
      agent.status = state;
      agent.statusconnected = true;
      agent.number_phone = infoClient?.wid?.user || null;
      agent.qrcode = null;

      await agent.save();

      // --- BLOCO OPCIONAL: RECUPERAR CHATS ---
      // Descomente se quiser listar os chats ao iniciar
      /*
      const chats = await client.getChats();
      for (const chat of chats) {
        console.log(`Chat encontrado: ${chat.name || chat.id.user}`);

        const messages = await chat.fetchMessages({ limit: 1 });

        console.log(`Mensagens do chat "${chat.name || chat.id.user}":`);
        for (const message of messages) {
          console.log(`- ${message.fromMe ? 'Você' : 'Contato'}: ${message.body}`);
        }
      }
      */
    } catch (error) {
      console.error('Erro durante o evento "ready":', error);
    }
  });



  // await client.on('ready', async () => {
  //   console.log(`READY...${agent.name}`);
  //   const state = await client.getState()
  //   console.log("State:", state)
  //   const infoClient = await client.info
  //   console.log("Client:", infoClient.pushname, "- Phone number:", infoClient.wid.user)
  //   agent.status = state
  //   agent.statusconnected = true
  //   agent.number_phone = client.info.wid.user
  //   agent.qrcode = null
  //   await agent.save()

  //   //CÓDIGO QUE PEGA TODAS AS CONVERSAS QUANDO DESCONECTADO
  //   // try {
  //   //   // Obtém todos os chats
  //   //   const chats = await client.getChats();

  //   //   for (const chat of chats) {
  //   //     console.log(`Chat encontrado: ${chat.name || chat.id.user}`);

  //   //     // Obtém as últimas 5 mensagens do chat
  //   //     const messages = await chat.fetchMessages({ limit: 1 });

  //   //     console.log(`Mensagens do chat "${chat.name || chat.id.user}":`);
  //   //     for (const message of messages) {
  //   //       console.log(`- ${message.fromMe ? 'Você' : 'Contato'}: ${message.body}`);
  //   //     }
  //   //   }
  //   // } catch (error) {
  //   //   console.error('Erro ao acessar chats ou mensagens:', error);
  //   // }
  // });

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
  }, await GenerateRandomTime(60000, 80000, '----Time Send Message'))


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
  client.on('change_state', (state) => {
    console.log(`[${agent.id}] STATE =>`, state);
  });

  client.on('disconnected', async (reason) => {
  try {
    console.log(`[${agent.id}] DISCONNECTED =>`, reason);

    // Normaliza o "reason"
    let reasonText;

    if (typeof reason === 'string') {
      reasonText = reason;
    } else {
      try {
        reasonText = JSON.stringify(reason);
      } catch (e) {
        reasonText = 'Unable to stringify reason';
      }
    }

    // Limita a 500 caracteres
    reasonText = reasonText.slice(0, 500);
    // Salva log
    await Log.create({
      name: "Verify Connection in Api5555",
      message: reasonText,
      description: `${agent.id} desconectado`
    });
    // Atualiza o agente
    agent.status = 'Disconnected';
    agent.statusconnected = false;
    await agent.save();
  } catch (error) {
    console.error(`[${agent.id}] ERRO AO PROCESSAR DISCONNECT:`, error);
  }
  // Notificação externa
  try {
    const message = `O número ${agent.number_phone} foi desconectado!!!!`;
    await sendMessageWarning('553185228619@c.us', message);
  } catch (notifyErr) {
    console.error(`[${agent.id}] ERRO AO ENVIAR AVISO:`, notifyErr);
  }
});
//*************************************************************** */
  WhatsAppClientManager.addClient(agent.id.toString(), client);
  //console.log("150011>>>>>>", WhatsAppClientManager)

  let rejectCalls = true;
  client.on('call', async (call) => {
    //console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
    await Talk.create({
      cellphone: call.from,//await extractCellphone(shippingCampaign.cellphone),
      chatnumber: client.info.wid._serialized,
      message: `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`,
      type: "from"
    })
  });
  return client
}
export { startAgent }
