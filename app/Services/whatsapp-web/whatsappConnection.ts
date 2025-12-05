import Agent from 'App/Models/Agent'
import Config from 'App/Models/Config'
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import { DateTime } from 'luxon'
import ChatMonitoring from './ChatMonitoring/ChatMonitoring'
import ChatMonitoringInternal from './ChatMonitoring/ChatMonitoringInternal'
import SendMessageInternal from './SendMessageInternal'
import { GenerateRandomTime, sendMessageWarning } from './util'
import Chat from 'App/Models/Chat'
import Application from '@ioc:Adonis/Core/Application'
import WhatsAppClientManager from './WhatsAppClientManager'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'

// whatsapp-web.js / qrcode
const { Client, LocalAuth } = require('whatsapp-web.js')
const qrcodeTerminal = require('qrcode-terminal')
const qrcode = require('qrcode')

// =====================================================
// STATUS GLOBAL (igual ao seu, só com uma proteção extra)
// =====================================================
async function getStatusSendMessage() {
  const result = await Config.query()
    .select('valuebool', 'valuedatetime')
    .where('id', 'statusSendMessage')
    .first()

  if (!result?.$attributes?.valuedatetime) return false

  const dateNow = DateTime.now()
  const dateConfig = DateTime.fromJSDate(result.$attributes.valuedatetime)
  const diffMinutes = dateNow.diff(dateConfig).as('minutes')

  return result.$attributes.valuebool == 1 && diffMinutes > 5
}

// =====================================================
// LOOPS (substituem os 2 setInterval)
// - 1 loop por agent para SendMessage
// - 1 loop por agent para SendMessageInternal
// =====================================================
const sendTimers = new Map<number, NodeJS.Timeout>()
const sendLocks = new Set<number>()

const internalTimers = new Map<number, NodeJS.Timeout>()
const internalLocks = new Set<number>()

function stopAllLoops(agentId: number) {
  const t1 = sendTimers.get(agentId)
  if (t1) clearTimeout(t1)
  sendTimers.delete(agentId)
  sendLocks.delete(agentId)

  const t2 = internalTimers.get(agentId)
  if (t2) clearTimeout(t2)
  internalTimers.delete(agentId)
  internalLocks.delete(agentId)
}

function startSendLoop(client: any, agent: Agent) {
  // garante que não duplica loop (reconnect / start repetido)
  const agentId = agent.id
  const startTimeSendMessage = agent.interval_init_message
  const endTimeSendMessage = agent.interval_final_message

  // mata loop anterior, se existir
  const old = sendTimers.get(agentId)
  if (old) clearTimeout(old)
  sendTimers.delete(agentId)
  sendLocks.delete(agentId)

  const tick = async () => {
    try {
      if (sendLocks.has(agentId)) return
      sendLocks.add(agentId)

      console.log('!!!!!send message @@@@')
      const statusSendMessage = await getStatusSendMessage()
      if (statusSendMessage) {
        // IMPORTANTE: await para não sobrepor uma execução na outra
        await SendMessage(client, agent)
      }
    } catch (e) {
      console.error(`[${agentId}] Erro no loop SendMessage:`, e)
    } finally {
      sendLocks.delete(agentId)

      // random a cada ciclo
      const delay = await GenerateRandomTime(
        startTimeSendMessage,
        endTimeSendMessage,
        '----Time Send Message'
      )

      const id = setTimeout(tick, delay)
      sendTimers.set(agentId, id)
    }
  }

  // inicia imediatamente
  tick()
}

function startInternalLoop(client: any, agent: Agent) {
  const agentId = agent.id

  // mata loop anterior, se existir
  const old = internalTimers.get(agentId)
  if (old) clearTimeout(old)
  internalTimers.delete(agentId)
  internalLocks.delete(agentId)

  const tick = async () => {
    try {
      if (internalLocks.has(agentId)) return
      internalLocks.add(agentId)

      const statusSendMessage = await getStatusSendMessage()
      if (statusSendMessage) {
        if (process.env.SELF_CONVERSATION?.toLowerCase() === 'true') {
          await SendMessageInternal(client)
        }
      }
    } catch (e) {
      console.error(`[${agentId}] Erro no loop SendMessageInternal:`, e)
    } finally {
      internalLocks.delete(agentId)

      // random a cada ciclo (mantive seu range 60~80s)
      const delay = await GenerateRandomTime(60000, 80000, '----Time Send Message')
      const id = setTimeout(tick, delay)
      internalTimers.set(agentId, id)
    }
  }

  tick()
}

// =====================================================
// START AGENT
// =====================================================
async function startAgent(_agent: Agent) {
  console.log('whatsappConnections.....')

  const agent = await Agent.findOrFail(_agent.id)
  if (!_agent) {
    console.log('CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents')
    return
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: _agent.id,
      dataPath: Application.tmpPath('/sessions'),
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
        '--disable-gpu',
      ],
      headless: true,
      dumpio: false,
      setJavaScriptEnabled: true,
    },
    webVersion: '2.3000.1026075099-alpha',
    webVersionPath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1026075099-alpha.html',
  })

  client.initialize()

  client.on('loading_screen', (percent, message) => {
    console.log(`LOADING SCREEN: ${_agent.name}`, percent, message)
  })

  client.on('qr', async (qr) => {
    try {
      agent.status = 'Qrcode require'
      agent.statusconnected = false
      await agent.save()

      const url = await new Promise((resolve, reject) => {
        qrcode.toDataURL(qr, (err, url) => {
          if (err) return reject(err)
          resolve(url)
        })
      })

      agent.qrcode = url as string
      await agent.save()

      qrcodeTerminal.generate(qr, { small: true })
    } catch (error) {
      console.error('Erro ao processar QR code:', error)
    }
  })

  client.on('authenticated', async () => {
    try {
      console.log(`AUTHENTICATED ${agent.name}`)
      agent.status = 'Authentication'
      agent.statusconnected = true
      agent.number_phone = client.info?.wid?.user || null
      agent.qrcode = null
      await agent.save()
    } catch (error) {
      console.error('Erro ao atualizar agente após autenticação:', error)
    }
  })

  client.on('auth_failure', async (msg) => {
    console.error('AUTHENTICATION FAILURE', msg)

    // para loops porque o client pode estar inválido
    stopAllLoops(agent.id)

    try {
      agent.status = 'Auth failure'
      agent.statusconnected = false
      await agent.save()
    } catch (e) {
      console.error(`[${agent.id}] ERRO AO SALVAR Agent em auth_failure:`, e)
    }
  })

  client.on('ready', async () => {
    try {
      console.log(`READY... ${agent.name}`)

      const state = await client.getState()
      console.log('State:', state)

      const infoClient = await client.info
      console.log('Client:', infoClient.pushname, '- Phone number:', infoClient.wid?.user)

      agent.status = state
      agent.statusconnected = true
      agent.number_phone = infoClient?.wid?.user || null
      agent.qrcode = null
      await agent.save()

      // ✅ INICIA OS LOOPS AQUI (substitui os 2 setInterval)
      startSendLoop(client, agent)
      startInternalLoop(client, agent)
    } catch (error) {
      console.error('Erro durante o evento "ready":', error)
    }
  })

  // Monitoring (mantido)
  const chatMonitoring = new ChatMonitoring()
  await chatMonitoring.monitoring(client, agent)

  if (process.env.SELF_CONVERSATION?.toLowerCase() === 'true') {
    const chatMonitoringInternal = new ChatMonitoringInternal()
    await chatMonitoringInternal.monitoring(client)
  }

  client.on('message_ack', async (msg, ack) => {
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
  })

  client.on('change_state', (state) => {
    console.log(`[${agent.id}] STATE =>`, state)
  })

  client.on('disconnected', async (reason) => {
    // ✅ para loops ao desconectar
    stopAllLoops(agent.id)

    try {
      console.log(`[${agent.id}] DISCONNECTED =>`, reason)

      let reasonText: string
      if (typeof reason === 'string') reasonText = reason
      else {
        try {
          reasonText = JSON.stringify(reason)
        } catch {
          reasonText = 'Unable to stringify reason'
        }
      }
      reasonText = reasonText.slice(0, 500)

      await Log.create({
        name: 'Verify Connection in Api5555',
        message: reasonText,
        description: `${agent.id} desconectado`,
      })

      agent.status = 'Disconnected'
      agent.statusconnected = false
      await agent.save()
    } catch (error) {
      console.error(`[${agent.id}] ERRO AO PROCESSAR DISCONNECT:`, error)
    }

    try {
      const message = `O número ${agent.number_phone} foi desconectado!!!!`
      await sendMessageWarning('553185228619@c.us', message)
    } catch (notifyErr) {
      console.error(`[${agent.id}] ERRO AO ENVIAR AVISO:`, notifyErr)
    }
  })

  WhatsAppClientManager.addClient(agent.id.toString(), client)

  let rejectCalls = true
  client.on('call', async (call) => {
    if (rejectCalls) await call.reject()
    await client.sendMessage(
      call.from,
      `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`
    )
    await Talk.create({
      cellphone: call.from,
      chatnumber: client.info.wid._serialized,
      message: `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`,
      type: 'from',
    })
  })

  return client
}

export { startAgent }
