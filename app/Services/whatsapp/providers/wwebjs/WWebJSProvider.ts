// App/Services/whatsapp/providers/wwebjs/WWebJSProvider.ts

import Application from '@ioc:Adonis/Core/Application'
import { Client, LocalAuth, MessageMedia, Message } from 'whatsapp-web.js'
import {
  IWhatsAppProvider,
  ProviderKind,
  WaAck,
  WaInboundMessage,
} from 'App/Services/whatsapp/core/IWhatsAppProvider'
const qrcodeTerminal = require('qrcode-terminal')

/**
 * Função utilitária simples para manter apenas dígitos de um número/JID.
 * Ex: "5531999998888@c.us" => "5531999998888"
 */
function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

/**
 * Provider que IMPLEMENTA a interface genérica IWhatsAppProvider
 * usando a biblioteca whatsapp-web.js por baixo.
 *
 * Ele é o "adapter" entre:
 *   - o MUNDO EXTERNO (whatsapp-web.js, Puppeteer, sessão, etc.)
 *   - e o MUNDO INTERNO (seu sistema, que só fala com IWhatsAppProvider).
 */
export default class WWebJSProvider implements IWhatsAppProvider {
  /**
   * Identifica o tipo deste provider.
   * Útil para logs e decisões específicas.
   */
  public kind: ProviderKind = 'wwebjs'

  /**
   * Mapa de agentId -> Client (instância do whatsapp-web.js).
   * Cada agente da sua tabela `agents` pode ter um client diferente.
   */
  private clients = new Map<number, Client>()

  /**
   * Callbacks registrados pela aplicação para tratar:
   *  - mensagens recebidas (onMessage)
   *  - ACKs de mensagens enviadas (onAck)
   *  - desconexões (onDisconnected)
   *
   * Inicialmente são funções "vazias", e depois a camada de negócio
   * (MessageRouter, por exemplo) registra as funções verdadeiras.
   */
  private onMessageCb: (msg: WaInboundMessage) => Promise<void> = async () => { }
  private onAckCb: (ack: WaAck) => Promise<void> = async () => { }
  private onDisconnectedCb: (agentId: number, reason: string) => Promise<void> = async () => { }

  /**
   * Registra callback para mensagens recebidas.
   */
  public onMessage(cb: (msg: WaInboundMessage) => Promise<void>): void {
    this.onMessageCb = cb
  }

  /**
   * Registra callback para ACKs de mensagens enviadas.
   */
  public onAck(cb: (ack: WaAck) => Promise<void>): void {
    this.onAckCb = cb
  }

  /**
   * Registra callback para eventos de desconexão do agente.
   */
  public onDisconnected(cb: (agentId: number, reason: string) => Promise<void>): void {
    this.onDisconnectedCb = cb
  }

  /**
   * Inicia (ou garante que está iniciada) a sessão do agente.
   * Aqui é onde configuramos o Client do whatsapp-web.js.
   *
   * IMPORTANTE:
   *  - Neste passo, estamos focando em subir o client e ligar eventos.
   *  - Ainda NÃO estamos colocando regra de negócio (SendMessage, ChatMonitoring, etc.).
   *    Isso vem depois, usando this.onMessageCb, this.onAckCb, etc.
   */
  public async start(agentId: number): Promise<void> {
    // Se já existe um client para este agent, não cria outro.
    if (this.clients.has(agentId)) {
      const client = this.clients.get(agentId)!
      try {
        const state = await client.getState()
        // Se já estiver "CONNECTED" (ou parecido), apenas retorna.
        if (state) {
          console.log(`[WWebJSProvider] Agent ${agentId} já está com state: ${state}`)
          return
        }
      } catch {
        // Se der erro ao pegar state, vamos recriar o client mesmo assim.
        console.log(`[WWebJSProvider] Erro ao obter state do agent ${agentId}, recriando client...`)
      }
    }

    console.log(`[WWebJSProvider] Inicializando client para agentId: ${agentId}`)

    // Configuração do Client (você pode ajustar conforme seu código atual)
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: agentId.toString(), // id da sessão baseado no agentId
        dataPath: Application.tmpPath('/sessions'), // mesma pasta de sessões que você já usa
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
      // Versão web e caminho, como você já fazia
      webVersion: '2.3000.1026075099-alpha',
      webVersionPath:
        'https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1026075099-alpha.html',
    })

    // --- Eventos do client ---

    client.on('loading_screen', (percent, message) => {
      console.log(`[WWebJSProvider][${agentId}] LOADING`, percent, message)
    })

    client.on('qr', (qr) => {
      console.log(`[WWebJSProvider][${agentId}] QR code recebido (engine).`)

      try {
        // Desenha o QR code no terminal (modo compacto)
        qrcodeTerminal.generate(qr, { small: true })
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao gerar QR no terminal:`, e)
      }
    })


    client.on('authenticated', () => {
      console.log(`[WWebJSProvider][${agentId}] AUTHENTICATED`)
      // Aqui, no futuro, você pode atualizar Agent no banco (status, number_phone etc.)
    })

    client.on('auth_failure', (msg) => {
      console.error(`[WWebJSProvider][${agentId}] AUTH FAILURE`, msg)
      // Aqui daria para chamar this.onDisconnectedCb(agentId, 'AUTH_FAILURE')
      // e/ou atualizar tabela Agent.
      this.onDisconnectedCb(agentId, `AUTH_FAILURE: ${msg}`)
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
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao obter info:`, e)
      }
    })

    /**
     * Evento de mensagens RECEBIDAS.
     * Aqui fazemos a ponte:
     *   - Message (tipo do whatsapp-web.js)
     *   -> WaInboundMessage (tipo genérico do sistema)
     *   -> this.onMessageCb(...)
     */
    client.on('message', async (message: Message) => {
      try {
        const from = message.from // ex: "55319...@c.us" ou "@lid"
        const to = message.to     // ex: número do seu bot/agent

        const inbound: WaInboundMessage = {
          provider: this.kind,
          agentId,
          from,
          to,
          body: message.body || '',
          hasMedia: !!message.hasMedia,
          messageId: message.id?._serialized || `${from}-${message.timestamp}`,
          timestamp: (message.timestamp || Date.now() / 1000) * 1000, // converte para ms
          raw: message,
        }

        await this.onMessageCb(inbound)
      } catch (e) {
        console.error(`[WWebJSProvider][${agentId}] Erro ao processar message:`, e)
      }
    })

    /**
     * Evento de ACK (status de mensagem enviada).
     */
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

    /**
     * Evento de desconexão.
     */
    client.on('disconnected', async (reason) => {
      console.log(`[WWebJSProvider][${agentId}] DISCONNECTED =>`, reason)
      // Remove o client do mapa
      this.clients.delete(agentId)

      let reasonText = ''
      if (typeof reason === 'string') {
        reasonText = reason
      } else {
        try {
          reasonText = JSON.stringify(reason)
        } catch {
          reasonText = 'Unable to stringify reason'
        }
      }

      await this.onDisconnectedCb(agentId, reasonText)
    })

    // Guarda o client no mapa antes de inicializar
    this.clients.set(agentId, client)

    // Inicializa a sessão (gera QR, conecta etc.)
    client.initialize()
  }

  /**
   * Para/desconecta a sessão do agente.
   */
  public async stop(agentId: number): Promise<void> {
    const client = this.clients.get(agentId)
    if (!client) return

    try {
      console.log(`[WWebJSProvider][${agentId}] stop() chamado, destruindo client...`)
      await client.destroy()
    } catch (e) {
      console.error(`[WWebJSProvider][${agentId}] Erro ao destruir client:`, e)
    } finally {
      this.clients.delete(agentId)
    }
  }

  /**
   * Retorna o estado atual do client para o agentId.
   */
  public async getState(agentId: number): Promise<string> {
    const client = this.clients.get(agentId)
    if (!client) return 'DISCONNECTED'

    try {
      const state = await client.getState()
      return state || 'UNKNOWN'
    } catch (e) {
      console.error(`[WWebJSProvider][${agentId}] Erro em getState:`, e)
      return 'ERROR'
    }
  }

  /**
   * Envia mensagem de TEXTO usando o client do whatsapp-web.js.
   */
  public async sendText(agentId: number, to: string, text: string): Promise<{ messageId: string }> {
    const client = this.clients.get(agentId)
    if (!client) {
      throw new Error(`[WWebJSProvider][${agentId}] Client não encontrado ao tentar sendText`)
    }

    const result = await client.sendMessage(to, text)
    return {
      messageId: result.id?._serialized || `${to}-${Date.now()}`,
    }
  }

  /**
   * Envia mensagem com MÍDIA (arquivo).
   */
  public async sendMedia(
    agentId: number,
    to: string,
    filePath: string,
    caption?: string
  ): Promise<{ messageId: string }> {
    const client = this.clients.get(agentId)
    if (!client) {
      throw new Error(`[WWebJSProvider][${agentId}] Client não encontrado ao tentar sendMedia`)
    }

    const media = MessageMedia.fromFilePath(filePath)
    const result = await client.sendMessage(to, media, {
      caption,
      // se quiser replicar seu comportamento atual:
      // sendMediaAsDocument: true,
    } as any)

    return {
      messageId: result.id?._serialized || `${to}-${Date.now()}`,
    }
  }
}
