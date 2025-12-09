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

  // agentId -> Client
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

  // ==========================================================
  // Utils
  // ==========================================================
  private onlyDigits(v: any): string {
    return String(v ?? '').replace(/\D/g, '')
  }

  /**
   * Resolve JID -> phoneJid/digits quando vier @lid
   * - @c.us => retorna o próprio
   * - @lid  => tenta getContactLidAndPhone([jid]) e retorna pn (ex: 5531...@c.us)
   */
  private async resolveJid(client: Client, jid: string) {
    if (!jid) return { jid, phoneJid: null as string | null, digits: '' }

    if (jid.endsWith('@c.us')) {
      return { jid, phoneJid: jid, digits: this.onlyDigits(jid) }
    }

    if (jid.endsWith('@lid')) {
      try {
        const result = await (client as any).getContactLidAndPhone([jid])
        const pn: string | null = result?.[0]?.pn || null
        return { jid, phoneJid: pn, digits: this.onlyDigits(pn) }
      } catch {
        return { jid, phoneJid: null, digits: '' }
      }
    }

    // outros tipos
    return { jid, phoneJid: null, digits: this.onlyDigits(jid) }
  }

  /**
   * Resolve o chatId correto para envio:
   * - se já for JID (c.us/lid/g.us/broadcast), usa direto
   * - se for número, usa getNumberId
   */
  private async resolveChatId(client: Client, to: string): Promise<string> {
    if (!to) throw new Error('Destino (to) vazio')

    let v = String(to).trim()

    if (
      v.endsWith('@c.us') ||
      v.endsWith('@lid') ||
      v.endsWith('@g.us') ||
      v.endsWith('@broadcast')
    ) {
      return v
    }

    v = v.replace(/@.*/g, '')
    const digits = this.onlyDigits(v)
    if (!digits) throw new Error(`Não foi possível extrair dígitos válidos de: ${to}`)

    const numberId = await client.getNumberId(digits)
    if (!numberId) throw new Error(`Número não registrado no WhatsApp: ${digits}`)

    return numberId._serialized
  }

  // ==========================================================
  // Lifecycle
  // ==========================================================
  public async start(agentId: number): Promise<void> {
    // ✅ evita start duplicado (isso causa listener duplicado e mensagens duplicadas)
    if (this.clients.has(agentId)) {
      console.log(`[WWebJSProvider][${agentId}] start() ignorado: client já existe para este agentId`)
      return
    }

    console.log(`[WWebJSProvider] Inicializando client para agentId: ${agentId}`)

    const sessionsDir = Application.tmpPath('sessions-engine')
    const sessionDir = path.join(sessionsDir, `session-${agentId}`)

    fs.mkdirSync(sessionDir, { recursive: true })

    const singletonLock = path.join(sessionDir, 'SingletonLock')
    if (fs.existsSync(singletonLock)) {
      console.log(`[WWebJSProvider][${agentId}] Removendo SingletonLock antigo...`)
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

    // registra ANTES do initialize (pra não perder eventos)
    this.clients.set(agentId, client)

    // ----------------------------------------------------------
    // Eventos
    // ----------------------------------------------------------
    client.on('loading_screen', (percent, message) => {
      console.log(`[WWebJSProvider][${agentId}] LOADING ${percent} ${message}`)
    })

    client.on('qr', async (qrValue) => {
      console.log(`[WWebJSProvider][${agentId}] QR code recebido.`)

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
        console.error(`[WWebJSProvider][${agentId}] Erro em AUTHENTICATED:`, e)
      }
    })

    // ✅ importante: quando falha auth (senha, sessão quebrada, etc.)
    client.on('auth_failure', async (msg) => {
      console.error(`[WWebJSProvider][${agentId}] AUTH_FAILURE =>`, msg)

      try {
        const agent = await Agent.find(agentId)
        if (agent) {
          agent.status = 'Auth failure'
          agent.statusconnected = false
          await agent.save()
        }
      } catch { }
    })

    // ✅ útil pra diagnosticar quedas (CONNECTED / OPENING / PAIRING / etc.)
    client.on('change_state', async (state) => {
      console.log(`[WWebJSProvider][${agentId}] STATE =>`, state)
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
        console.error(`[WWebJSProvider][${agentId}] Erro em READY:`, e)
      }
    })

    /**
     * ✅ RECEBIMENTO -> Engine/Router
     * Normaliza:
     * - @lid -> fromPhoneJid + fromDigits
     * - grupos: isGroup + authorDigits
     */
    client.on('message', async (message: Message) => {

      console.log('********[WEBJS][RAW MESSAGE]', {
        from: message.from,
        to: message.to,
        body: message.body,
        hasMedia: message.hasMedia,
        fromMe: (message as any).fromMe,
        type: (message as any).type,
        id: message.id?._serialized,
      })

      try {
        const isGroup = !!message.from?.endsWith('@g.us')

        const resolvedFrom = await this.resolveJid(client, message.from)
        const resolvedAuthor =
          isGroup && message.author ? await this.resolveJid(client, message.author) : null

        const inbound: WaInboundMessage = {
          provider: this.kind,
          agentId,
          from: message.from,
          to: message.to,
          body: message.body || '',
          hasMedia: !!message.hasMedia,
          messageId: message.id?._serialized || `${message.from}-${message.timestamp}`,
          timestamp: (message.timestamp || Date.now() / 1000) * 1000,
          raw: message,

          // extras pro Router
          isGroup,
          author: isGroup ? (message.author || null) : null,
          fromPhoneJid: resolvedFrom.phoneJid,
          fromDigits: isGroup
            ? ''
            : (resolvedFrom.digits || this.onlyDigits(message.from)),
          authorDigits: isGroup
            ? (resolvedAuthor?.digits || this.onlyDigits(message.author))
            : '',
        }

        console.log('[WhatsAppEngine] Inbound WEBJS:', {
          provider: inbound.provider,
          agentId: inbound.agentId,
          from: inbound.from,
          to: inbound.to,
          fromPhoneJid: inbound.fromPhoneJid,
          fromDigits: inbound.fromDigits,
          isGroup: inbound.isGroup,
          author: inbound.author,
          authorDigits: inbound.authorDigits,
          body: inbound.body,
          hasMedia: inbound.hasMedia,
          messageId: inbound.messageId,
        })

        await this.onMessageCb(inbound)
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao processar message:`, e)
      }
    })

    client.on('message_ack', async (msg, ack) => {
      try {
        const waAck: WaAck = {
          provider: this.kind,
          agentId,
          from: msg.from,
          to: msg.to,
          messageId: msg.id?._serialized || `${msg.from}-${msg.timestamp}`,
          ack,
          timestamp: (msg.timestamp || Date.now() / 1000) * 1000,
        }
        await this.onAckCb(waAck)
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro em message_ack:`, e)
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
        console.error(`[WWebJSProvider][${agentId}] Erro em DISCONNECTED(save agent):`, e)
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

    // inicializa (com catch para não falhar silencioso)
    client.initialize().catch(async (err) => {
      console.error(`[WWebJSProvider][${agentId}] initialize() falhou:`, err)
      this.clients.delete(agentId)

      try {
        const agent = await Agent.find(agentId)
        if (agent) {
          agent.status = 'Initialize failed'
          agent.statusconnected = false
          await agent.save()
        }
      } catch { }
    })
  }

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

  public async getState(agentId: number): Promise<string> {
    const client = this.clients.get(agentId)
    if (!client) return 'DISCONNECTED'

    try {
      // @ts-ignore internals
      const pupPage = (client as any).pupPage
      if (!pupPage) return 'INITIALIZING'

      const state = await client.getState()
      return state || 'UNKNOWN'
    } catch (e) {
      console.error(`[WWebJSProvider][${agentId}] Erro em getState:`, e)
      return 'ERROR'
    }
  }

  public async sendText(agentId: number, to: string, text: string): Promise<any> {
    const client = this.clients.get(agentId)
    if (!client) throw new Error(`Client não encontrado para agentId=${agentId}`)

    const chatId = await this.resolveChatId(client, to)
    console.log(`[WWebJSProvider][${agentId}] Enviando texto para ${chatId}`)
    return client.sendMessage(chatId, text)
  }

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
