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
    response?: string | null
    pathMedia?: string | null
  }): Promise<Customchat> {
    const { chat, cellphoneserialized, senderName, appName, message, response, pathMedia } =
      options

    const rawText = (response ?? message) || ''

    const finalResponse =
      rawText.trim() !== ''
        ? rawText
        : pathMedia
        ? '[Áudio / mídia recebida]'
        : ''

    const custom = await Customchat.create({
      chats_id: chat.id,
      reg: chat.reg,
      cellphone: chat.cellphone || cellphoneserialized,
      cellphoneserialized,
      chatname: senderName || chat.chatname || appName || 'WhatsApp',
      chatnumber: chat.chatnumber || null,

      message: '',
      response: finalResponse,

      path_media: pathMedia || null,
      returned: true,
      messagesent: false,
    })

    await Talk.create({
      chat_id: chat.id,
      reg: custom.reg,
      cellphone: cellphoneserialized,
      message: finalResponse,
      chatnumber: custom.chatnumber,
      type: 'from',
    })

    return custom
  }

  /**
   * Helper: atualiza ACK de Customchat a partir de message-event
   */
  private async updateAckFromMessageEvent(
    appName: string | undefined,
    payload: any
  ): Promise<void> {
    const eventType: string = payload.type // ex: enqueued, sent, delivered, read, failed...
    const innerPayload = payload.payload || {}

    const whatsappMessageIdFromEvent = innerPayload.whatsappMessageId
    const messageIdFromEvent = payload.id
    const gsIdFromEvent = payload.gsId || innerPayload.gsId

    const candidateIds = [
      whatsappMessageIdFromEvent,
      messageIdFromEvent,
      gsIdFromEvent,
    ].filter(Boolean) as string[]

    if (candidateIds.length === 0) {
      console.warn('message-event sem nenhum ID utilizável, ignorando.', {
        appName,
        payload,
      })
      return
    }

    console.log('📡 message-event recebido Gupshup (ACK):', {
      appName,
      eventType,
      candidateIds,
    })

    const custom = await Customchat.query()
      .where((query) => {
        candidateIds.forEach((id, idx) => {
          if (idx === 0) {
            query.where('gupshup_gs_id', id)
          } else {
            query.orWhere('gupshup_gs_id', id)
          }
        })
      })
      .orderBy('id', 'desc')
      .first()

    if (!custom) {
      console.warn('Nenhum Customchat encontrado para gupshup_gs_id em:', candidateIds)
      return
    }

    let ack = custom.ack ?? 0

    switch (eventType) {
      case 'submitted':
      case 'enqueued':
        ack = 1
        break
      case 'sent':
        ack = 2
        break
      case 'delivered':
        ack = 3
        break
      case 'read':
        ack = 4
        break
      case 'failed':
        ack = 9
        break
      default:
        console.log('message-event com tipo não mapeado:', eventType)
        break
    }

    custom.ack = ack
    await custom.save()

    console.log('✅ ACK atualizado via message-event:', {
      id: custom.id,
      gupshup_gs_id: custom.gupshupGsId,
      eventType,
      ack,
    })
  }

  public async handle({ request, response }: HttpContextContract) {
    const rawBody = request.raw()
    const appName = request.input('app') as string | undefined

    if (appName === 'Digi3Sistemas6') {
      console.log('=== GUPSHUP WEBHOOK RAW STRING ===')
      console.log(rawBody)
      console.log('=== FIM RAW STRING ===')
    }

    const body = request.all()

    response.status(200).send({ ok: true })

    try {
      const type = body?.type
      const payload = body?.payload

      if (!payload) {
        console.log('Webhook sem payload, ignorando.')
        return
      }

      // 1) message-event -> ACK
      if (type === 'message-event') {
        await this.updateAckFromMessageEvent(appName, payload)
        return
      }

      // 2) Eventos de mensagem (entrantes)
      try {
        await this.monitoring.handle(payload as MessageLike)
      } catch (err) {
        console.warn('Erro no GupshupMonitoring.handle (ignorado):', err)
      }

      if (type !== 'message') {
        console.log('Webhook não é do tipo "message", type:', type)
        return
      }

      const messageType: string = payload.type // 'text', 'audio', etc.
      const source: string = payload.source
      const sender = payload.sender || {}
      const dialCode: string | undefined = sender.dial_code
      const senderName: string | undefined = sender.name

      const cellphoneserialized = await normalizePhoneKey(dialCode || source)

      const chat = await this.findOrCreateChatByNumber(
        cellphoneserialized,
        senderName,
        appName || null
      )

      // TEXTO
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
          message: text,
          pathMedia: null,
        })

        await Chat.query().where('id', chat.id).update({ last_response: 0 })

        return
      }

      // ÁUDIO
      if (messageType === 'audio') {
        const audioUrl: string | undefined = payload.payload?.url
        const contentType: string | undefined = payload.payload?.contentType

        if (!audioUrl) {
          console.warn('Payload de áudio sem URL, ignorando.')
          return
        }

        let ext = 'audio'
        if (contentType?.includes('ogg')) {
          ext = 'ogg'
        } else if (contentType?.includes('mpeg') || contentType?.includes('mp3')) {
          ext = 'mp3'
        }

        const rawId = String(payload.id)
        const safeId = rawId.replace(/[^a-zA-Z0-9_.-]/g, '_')
        const relativeFileName = `${safeId}.${ext}`

        const baseDir = Application.makePath('Medias', 'Customchats')
        const absolutePath = `${baseDir}/${relativeFileName}`

        await fs.mkdir(dirname(absolutePath), { recursive: true })

        const audioResponse = await axios.get<ArrayBuffer>(audioUrl, {
          responseType: 'arraybuffer',
        })
        await fs.writeFile(absolutePath, Buffer.from(audioResponse.data))

        console.log(`🎧 Áudio Gupshup salvo em: ${absolutePath} CT: ${contentType}`)
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
          message: '[Áudio recebido]',
          pathMedia: relativeFileName,
        })

        await Chat.query().where('id', chat.id).update({ last_response: 0 })

        return
      }

      console.log('Tipo de mensagem não tratado explicitamente:', messageType)
    } catch (error) {
      console.error('Erro no processamento do webhook Gupshup:', error)

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
