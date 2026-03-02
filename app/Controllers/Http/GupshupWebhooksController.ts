// app/Controllers/Http/Webhooks/GupshupWebhookController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GupshupMonitoring from 'App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring'
import { MessageLike } from 'App/Services/whatsapp-gupshup-monitoring/types'
import Chat from 'App/Models/Chat'
import Customchat from 'App/Models/Customchat'
import Log from 'App/Models/Log'
import Talk from 'App/Models/Talk'
import { DateTime } from 'luxon'

import axios from 'axios'
import Application from '@ioc:Adonis/Core/Application'
import { promises as fs } from 'fs'
import { dirname } from 'path'
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  /**
   * Helper: encontra ou cria um Chat a partir do número normalizado
   */
  private async findOrCreateChatByNumber(
    cellphoneserialized: string,
    senderName?: string | null,
    appName?: string | null
  ): Promise<Chat> {
    let chat = await Chat.query()
      .where('cellphoneserialized', cellphoneserialized)
      .orderBy('id', 'desc')
      .first()

    if (!chat) {
      chat = await Chat.create({
        cellphoneserialized,
        cellphone: cellphoneserialized,
        chatname: senderName || appName || 'WhatsApp',
        // coloque aqui outros campos default se sua tabela exigir
      })
    }

    return chat
  }

  /**
   * Helper: cria um Customchat de mensagem ENTRANTE (texto ou mídia)
   * Agora grava o conteúdo em `response` (e não mais em `message`)
   */
  private async createInboundCustomchat(options: {
    chat: Chat
    cellphoneserialized: string
    senderName?: string | null
    appName?: string | null
    message?: string
    response?: string | null // caso queira passar explicitamente no futuro
    pathMedia?: string | null
  }): Promise<Customchat> {
    const { chat, cellphoneserialized, senderName, appName, message, response, pathMedia } =
      options

    // Prioriza o texto vindo de `response` (se um dia usar), senão usa `message`
    const rawText = (response ?? message) || ''

    const finalResponse =
      rawText.trim() !== ''
        ? rawText
        : pathMedia
        ? '[Áudio / mídia recebida]'
        : ''

    const custom = await Customchat.create({
      chats_id: chat.id, // ✅ FK sempre preenchida
      reg: chat.reg, // se sua tabela de chats tiver reg
      cellphone: chat.cellphone || cellphoneserialized,
      cellphoneserialized,
      chatname: senderName || chat.chatname || appName || 'WhatsApp',
      chatnumber: chat.chatnumber || null,

      // 🔁 AGORA ENTRANTE VAI PARA `response`
      message: '', // opcional: deixa vazio para mensagens entrantes
      response: finalResponse,

      path_media: pathMedia || null,
      returned: true, // veio do cliente
      messagesent: false, // não foi agente
    })

    // opcional: registrar também na Talk para manter histórico unificado
    await Talk.create({
      chat_id: chat.id,
      reg: custom.reg,
      cellphone: cellphoneserialized,
      message: finalResponse, // mantém histórico unificado na Talk
      chatnumber: custom.chatnumber,
      type: 'from', // mensagem vinda do cliente
    })

    return custom
  }

  /**
   * ✅ NOVO: Helper para atualizar o ACK de um Customchat a partir do message-event da Gupshup
   */
  private async updateAckFromMessageEvent(
    appName: string | undefined,
    payload: any
  ): Promise<void> {
    const eventType: string = payload.type // ex: enqueued, sent, delivered, read, failed...
    const innerPayload = payload.payload || {}

    // Gupshup geralmente manda whatsappMessageId dentro de payload.payload
    const whatsappMessageId: string | undefined =
      innerPayload.whatsappMessageId || payload.id

    if (!whatsappMessageId) {
      console.warn('message-event sem whatsappMessageId/id, ignorando.')
      return
    }

    console.log('📡 message-event recebido Gupshup (ACK):', {
      appName,
      eventType,
      whatsappMessageId,
    })

    // procura o Customchat correspondente
    const custom = await Customchat.query()
      .where('gupshup_message_id', whatsappMessageId)
      .orderBy('id', 'desc')
      .first()

    if (!custom) {
      console.warn(
        'Nenhum Customchat encontrado para gupshup_message_id:',
        whatsappMessageId
      )
      return
    }

    // mapeia o tipo de evento para ACK
    let ack = custom.ack ?? 0

    switch (eventType) {
      case 'submitted':
      case 'enqueued':
        ack = 1 // enviado p/ Gupshup
        break
      case 'sent':
        ack = 2 // enviado ao WhatsApp
        break
      case 'delivered':
        ack = 3 // entregue ao aparelho
        break
      case 'read':
        ack = 4 // lido
        break
      case 'failed':
        ack = 9 // erro
        break
      default:
        console.log('message-event com tipo não mapeado:', eventType)
        break
    }

    custom.ack = ack
    await custom.save()

    console.log('✅ ACK atualizado via message-event:', {
      id: custom.id,
      gupshup_message_id: whatsappMessageId,
      eventType,
      ack,
    })
  }

  public async handle({ request, response }: HttpContextContract) {
    // body cru para debug
    const rawBody = request.raw()
    const appName = request.input('app') as string | undefined

    if (appName === 'Digi3Sistemas6') {
      console.log('=== GUPSHUP WEBHOOK RAW STRING ===')
      console.log(rawBody)
      console.log('=== FIM RAW STRING ===')
    }

    const body = request.all()

    // responde 200 rápido
    response.status(200).send({ ok: true })

    try {
      const type = body?.type
      const payload = body?.payload

      if (!payload) {
        console.log('Webhook sem payload, ignorando.')
        return
      }

      // =====================================================
      // 1) EVENTOS DE STATUS (message-event) -> atualiza ACK
      // =====================================================
      if (type === 'message-event') {
        await this.updateAckFromMessageEvent(appName, payload)
        return
      }

      // =====================================================
      // 2) EVENTOS DE MENSAGEM (ENTRANTES) -> texto/áudio
      // =====================================================

      // Opcional: mandar pro serviço de monitoramento se você já usa isso
      try {
        await this.monitoring.handle(payload as MessageLike)
      } catch (err) {
        console.warn('Erro no GupshupMonitoring.handle (ignorado):', err)
      }

      // Garantimos que é um evento de mensagem ENTRANTE
      if (type !== 'message') {
        console.log('Webhook não é do tipo "message", type:', type)
        return
      }

      const messageType: string = payload.type // 'text', 'audio', etc.
      const source: string = payload.source // ex: "553185228619"
      const sender = payload.sender || {}
      const dialCode: string | undefined = sender.dial_code // "3185228619"
      const senderName: string | undefined = sender.name

      // 1) Normaliza número igual no fluxo de texto
      const cellphoneserialized = await normalizePhoneKey(dialCode || source)

      // 2) Encontra ou cria Chat
      const chat = await this.findOrCreateChatByNumber(
        cellphoneserialized,
        senderName,
        appName || null
      )

      // --------------------------
      // TEXTO
      // --------------------------
      if (messageType === 'text') {
        const text: string = payload.payload?.text || ''

        console.log('📩 Texto recebido Gupshup:', {
          appName,
          cellphoneserialized,
          text,
        })

        await this.createInboundCustomchat({
          chat,
          cellphoneserialized,
          senderName,
          appName,
          // 🔁 Agora será gravado em `response`
          message: text,
          pathMedia: null,
        })

        // se quiser, pode atualizar last_response aqui
        await Chat.query().where('id', chat.id).update({ last_response: 0 })

        return
      }

      // --------------------------
      // ÁUDIO
      // --------------------------
      if (messageType === 'audio') {
        const audioUrl: string | undefined = payload.payload?.url
        const contentType: string | undefined = payload.payload?.contentType

        if (!audioUrl) {
          console.warn('Payload de áudio sem URL, ignorando.')
          return
        }

        // 3) Monta o caminho do arquivo
        let ext = 'audio'
        if (contentType?.includes('ogg')) {
          ext = 'ogg'
        } else if (contentType?.includes('mpeg') || contentType?.includes('mp3')) {
          ext = 'mp3'
        }

        // id original do WhatsApp (vem com caracteres especiais, inclusive '=')
        const rawId = String(payload.id)

        // deixa o id "safe" para nome de arquivo: só letras, números, ponto, sublinhado e hífen
        const safeId = rawId.replace(/[^a-zA-Z0-9_.-]/g, '_')

        // agora o arquivo salvo não terá '=' no nome
        const relativeFileName = `${safeId}.${ext}`

        const baseDir = Application.makePath('Medias', 'Customchats')
        const absolutePath = `${baseDir}/${relativeFileName}`

        await fs.mkdir(dirname(absolutePath), { recursive: true })

        // 4) Download do áudio
        const audioResponse = await axios.get<ArrayBuffer>(audioUrl, {
          responseType: 'arraybuffer',
        })
        await fs.writeFile(absolutePath, Buffer.from(audioResponse.data))

        console.log(
          `🎧 Áudio Gupshup salvo em: ${absolutePath} CT: ${contentType}`
        )
        console.log('🟢 Criando novo Customchat só com áudio:', {
          appName,
          dialCode,
          cellphoneserialized,
          relativeFileName,
          chats_id: chat.id,
        })

        await this.createInboundCustomchat({
          chat,
          cellphoneserialized,
          senderName,
          appName,
          // 🔁 texto “placeholder” também vai em `response`
          message: '[Áudio recebido]', // texto que aparece no histórico, mas salvo em `response`
          pathMedia: relativeFileName, // arquivo real, já sem '='
        })

        // se quiser, pode atualizar last_response aqui também
        await Chat.query().where('id', chat.id).update({ last_response: 0 })

        return
      }

      // --------------------------
      // OUTROS TIPOS (imagem, documento, etc.)
      // --------------------------
      console.log('Tipo de mensagem não tratado explicitamente:', messageType)
      // aqui você pode implementar outros tipos se quiser
    } catch (error) {
      console.error('Erro no processamento do webhook Gupshup:', error)

      // Opcional: logar em tabela de logs
      try {
        await Log.create({
          type: 'gupshup_webhook_error',
          description: 'Erro ao processar webhook Gupshup',
          log: JSON.stringify({
            error: String(error),
            stack: (error as any)?.stack,
          }),
          createdAt: DateTime.now(),
        })
      } catch (e) {
        console.error('Erro ao salvar Log de webhook Gupshup:', e)
      }
    }
  }
}
