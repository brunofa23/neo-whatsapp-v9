import Application from '@ioc:Adonis/Core/Application'
import Agent from 'App/Models/Agent'
import {
  IWhatsAppProvider,
  ProviderKind,
  WaAck,
  WaInboundMessage,
} from 'App/Services/whatsapp/core/IWhatsAppProvider'
import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js'
import fs from 'fs'
import path from 'path'

const qrcodeTerminal = require('qrcode-terminal')
const qrcode = require('qrcode')

export default class WWebJSProvider implements IWhatsAppProvider {
  public kind: ProviderKind = 'wwebjs'

  // Mapeia agentId -> Client
  private clients = new Map<number, Client>()

  // Callbacks registrados pelo WhatsAppEngine
  private onMessageCb: (msg: WaInboundMessage) => Promise<void> = async () => { }
  private onAckCb: (ack: WaAck) => Promise<void> = async () => { }
  private onDisconnectedCb: (agentId: number, reason: string) => Promise<void> = async () => { }

  public onMessage(cb: (msg: WaInboundMessage) => Promise<void>): void {
    this.onMessageCb = cb
  }

  public onAck(cb: (ack: WaAck) => Promise<void>): void {
    this.onAckCb = cb
  }

  public onDisconnected(cb: (agentId: number, reason: string) => Promise<void>): void {
    this.onDisconnectedCb = cb
  }

  /**
   * Extrai apenas os dígitos de um número (5531999999999)
   */
  private extractDigits(to: string): string {
    if (!to) return ''
    return String(to).replace(/\D/g, '')
  }

  /**
   * Resolve o chatId correto:
   *  - Se for grupo (@g.us) ou broadcast (@broadcast) → usa direto
   *  - Qualquer outra coisa (número puro, @c.us, @lid, etc) → extrai dígitos e
   *    usa client.getNumberId(digits), que retorna o _serialized correto (c.us ou lid)
   */
  private async resolveChatId(client: Client, to: string): Promise<string> {
    if (!to) throw new Error('Destino (to) vazio')

    let v = String(to).trim()

    // 🔹 CASO 1: já é um JID válido que veio do WhatsApp ou do banco
    // Ex:  "553197606015@c.us"
    //      "1292885856485@lid"
    //      "xxxx-xxxx@g.us"
    //      "xxxxx@broadcast"
    if (
      v.endsWith('@c.us') ||
      v.endsWith('@lid') ||
      v.endsWith('@g.us') ||
      v.endsWith('@broadcast')
    ) {
      return v
    }

    // 🔹 CASO 2: entrada "humana" (número puro, formatado etc)
    // Ex: "553197606015", "(31) 97606-6015", "553197606015 bla"
    v = v.replace(/@.*/g, '')

    const digits = this.extractDigits(v)
    if (!digits) {
      throw new Error(`Não foi possível extrair dígitos válidos de: ${to}`)
    }

    const numberId = await client.getNumberId(digits)

    if (!numberId) {
      throw new Error(`Número não registrado no WhatsApp: ${digits}`)
    }

    // Ex: "553197606015@c.us" ou "xxxxxxx@lid"
    return numberId._serialized
  }


  /**
   * Inicia o client para um agente (engine)
   * Usa pasta separada: tmp/sessions-engine/session-<agentId>
   */
  public async start(agentId: number): Promise<void> {
    console.log(`[WWebJSProvider] Inicializando client para agentId: ${agentId}`)

    const sessionsDir = Application.tmpPath('sessions-engine')
    const sessionDir = path.join(sessionsDir, `session-${agentId}`)

    fs.mkdirSync(sessionDir, { recursive: true })

    const singletonLock = path.join(sessionDir, 'SingletonLock')
    if (fs.existsSync(singletonLock)) {
      console.log(`[WWebJSProvider][${agentId}] Removendo SingletonLock antigo em sessions-engine...`)
      fs.unlinkSync(singletonLock)
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `engine-${agentId}`,
        dataPath: sessionsDir,
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
        // @ts-ignore
        setJavaScriptEnabled: true,
      },
      webVersion: '2.3000.1026075099-alpha',
      webVersionPath:
        'https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1026075099-alpha.html',
    })

    // ===== Eventos principais =====

    client.on('loading_screen', (percent, message) => {
      console.log(`[WWebJSProvider][${agentId}] LOADING ${percent} ${message}`)
    })

    client.on('qr', async (qrValue) => {
      console.log(`[WWebJSProvider][${agentId}] QR code recebido (engine).`)

      try {
        const agent = await Agent.find(agentId)
        if (agent) {
          const url = await qrcode.toDataURL(qrValue)

          agent.status = 'Qrcode required'
          agent.statusconnected = false
          agent.qrcode = url
          await agent.save()
        }

        qrcodeTerminal.generate(qrValue, { small: true })
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao processar QR:`, e)
      }
    })

    client.on('authenticated', async () => {
      console.log(`[WWebJSProvider][${agentId}] AUTHENTICATED`)

      try {
        const agent = await Agent.find(agentId)
        if (agent) {
          agent.status = 'Authentication'
          agent.statusconnected = true
          agent.qrcode = null
          await agent.save()
        }
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao atualizar agent em AUTHENTICATED:`, e)
      }
    })

    client.on('ready', async () => {
      console.log(`[WWebJSProvider][${agentId}] READY`)

      try {
        const info = client.info
        console.log(
          `[WWebJSProvider][${agentId}] Client info:`,
          info.pushname,
          '- phone:',
          info.wid?.user
        )

        const agent = await Agent.find(agentId)
        if (agent) {
          agent.status = 'CONNECTED'
          agent.statusconnected = true
          agent.number_phone = info?.wid?.user || agent.number_phone
          agent.qrcode = null
          await agent.save()
        }
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao atualizar agent em READY:`, e)
      }
    })

    client.on('message', async (message: Message) => {
      try {
        const from = message.from
        const to = message.to

        const inbound: WaInboundMessage = {
          provider: this.kind,
          agentId,
          from,
          to,
          body: message.body || '',
          hasMedia: !!message.hasMedia,
          messageId: message.id?._serialized || `${from}-${message.timestamp}`,
          timestamp: (message.timestamp || Date.now() / 1000) * 1000,
          raw: message,
        }

        await this.onMessageCb(inbound)
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao processar message:`, e)
      }
    })

    client.on('message_ack', async (msg, ack) => {
      try {
        const from = msg.from
        const to = msg.to

        const waAck: WaAck = {
          provider: this.kind,
          agentId,
          from,
          to,
          messageId: msg.id?._serialized || `${from}-${msg.timestamp}`,
          ack,
          timestamp: (msg.timestamp || Date.now() / 1000) * 1000,
        }

        await this.onAckCb(waAck)
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao processar message_ack:`, e)
      }
    })

    client.on('disconnected', async (reason) => {
      console.log(`[WWebJSProvider][${agentId}] DISCONNECTED =>`, reason)
      this.clients.delete(agentId)

      try {
        const agent = await Agent.find(agentId)
        if (agent) {
          agent.status = 'Disconnected'
          agent.statusconnected = false
          await agent.save()
        }
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao atualizar agent em DISCONNECTED:`, e)
      }

      let reasonText = ''
      if (typeof reason === 'string') reasonText = reason
      else {
        try {
          reasonText = JSON.stringify(reason)
        } catch {
          reasonText = 'Unable to stringify reason'
        }
      }

      await this.onDisconnectedCb(agentId, reasonText)
    })

    this.clients.set(agentId, client)
    client.initialize()
  }

  /**
   * Para/destrói o client de um agent
   */
  public async stop(agentId: number): Promise<void> {
    const client = this.clients.get(agentId)
    if (!client) return

    try {
      await client.destroy()
    } catch (e) {
      console.error(`[WWebJSProvider][${agentId}] Erro ao destruir client:`, e)
    } finally {
      this.clients.delete(agentId)

      try {
        const agent = await Agent.find(agentId)
        if (agent) {
          agent.status = 'Stopped'
          agent.statusconnected = false
          await agent.save()
        }
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao atualizar agent em stop:`, e)
      }
    }
  }

  /**
   * Estado atual do client (defensivo)
   */
  public async getState(agentId: number): Promise<string> {
    const client = this.clients.get(agentId)
    if (!client) return 'DISCONNECTED'

    try {
      // @ts-ignore internals
      const pupPage = (client as any).pupPage
      if (!pupPage) {
        return 'INITIALIZING'
      }

      const state = await client.getState()
      return state || 'UNKNOWN'
    } catch (e) {
      console.error(`[WWebJSProvider][${agentId}] Erro em getState:`, e)
      return 'ERROR'
    }
  }

  /**
   * Envia texto usando o client do agent
   */
  public async sendText(agentId: number, to: string, text: string): Promise<any> {
    const client = this.clients.get(agentId)
    if (!client) throw new Error(`Client não encontrado para agentId=${agentId}`)

    const chatId = await this.resolveChatId(client, to)
    console.log(`[WWebJSProvider][${agentId}] Enviando texto para ${chatId}`)

    return client.sendMessage(chatId, text)
  }

  /**
   * Envia mídia (como documento) com legenda opcional
   */
  public async sendMedia(
    agentId: number,
    to: string,
    filePath: string,
    caption?: string
  ): Promise<any> {
    const client = this.clients.get(agentId)
    if (!client) throw new Error(`Client não encontrado para agentId=${agentId}`)

    const chatId = await this.resolveChatId(client, to)
    console.log(`[WWebJSProvider][${agentId}] Enviando mídia para ${chatId}`)

    const media = MessageMedia.fromFilePath(filePath)
    return client.sendMessage(chatId, media, {
      caption,
      sendMediaAsDocument: true,
    })
  }
}
