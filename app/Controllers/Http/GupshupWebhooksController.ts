// app/Controllers/Http/Webhooks/GupshupWebhookController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GupshupMonitoring from 'App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring'
import { MessageLike } from 'App/Services/whatsapp-gupshup-monitoring/types'
import Chat from 'App/Models/Chat'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'
import Env from '@ioc:Adonis/Core/Env'

import axios from 'axios'
import Application from '@ioc:Adonis/Core/Application'
import { promises as fs } from 'fs'
import { dirname } from 'path'
import Customchat from 'App/Models/Customchat'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {
    // body cru
    const rawBody = request.raw()
    const appName = request.input('app') as string | undefined

    console.log('=== GUPSHUP WEBHOOK RAW STRING ===')
    console.log(rawBody)
    console.log('=== FIM RAW STRING ===')

    const body = request.all()

    response.status(200).send({ ok: true })

    try {
      await captureTestWebhookPayload(body, rawBody)

      /**
       * ✅ DOWNLOAD DE ÁUDIO (mensagens inbound de áudio)
       * ✅ padronizado com o texto:
       * - baixa e salva o arquivo
       * - NÃO cria Chat
       * - NÃO cria Customchat aqui
       * - chama Monitoring para salvar como texto (default_chat)
       */
      if (body?.type === 'message' && body?.payload?.type === 'audio') {
        const audioPayload = body.payload?.payload
        const url: string | undefined = audioPayload?.url
        const contentType: string = audioPayload?.contentType || ''

        const dialCode: string = String(body.payload?.sender?.dial_code || '').trim()

        if (!url) {
          console.log('⚠️ Áudio recebido mas sem URL no payload.')
          return
        }

        const extension =
          contentType.includes('ogg') ? 'ogg' : contentType.includes('mpeg') ? 'mp3' : 'bin'

        const messageId = String(body.payload?.id || Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName = `${messageId}.${extension}`

        const filePath = Application.makePath(`Medias/Customchats/${fileName}`)
        await fs.mkdir(dirname(filePath), { recursive: true })

        const res = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          validateStatus: () => true,
          timeout: 30000,
        })

        const ct = String(res.headers?.['content-type'] || '')
        if (res.status !== 200) {
          console.log('❌ Download do áudio falhou (status != 200)', { status: res.status, ct })
          return
        }

        if (!ct.startsWith('audio/')) {
          console.log('❌ Download retornou conteúdo que NÃO é áudio', { status: res.status, ct })
          return
        }

        const buf = Buffer.from(res.data)

        if (extension === 'ogg') {
          const magic = buf.slice(0, 4).toString('ascii')
          if (magic !== 'OggS') {
            console.log('❌ Conteúdo baixado não parece OGG (header inválido)', { magic, ct })
            return
          }
        }

        await fs.writeFile(filePath, buf)
        console.log('🎧 Áudio Gupshup salvo em:', filePath, 'CT:', ct)

        const relativeFileName = fileName

        // ✅ chama Monitoring para gravar como texto (default_chat), mas com path_media
        const from = String(body?.payload?.sender?.phone || body?.payload?.source || '').trim()
        const to = String(body?.payload?.destination || body?.payload?.to || '').trim()

        const msgForMonitoring: any = {
          from,
          to,
          body: '',
          hasMedia: true,
          raw: {
            ...body,
            path_media: relativeFileName,
          },
        }

        await this.monitoring.handleInbound(msgForMonitoring)
        return
      }

      const evt = parseMessageEvent(body)
      if (evt) {
        const ack = mapEventToAck(evt.eventType)

        await Chat.query().where('gupshup_gs_id', evt.gsId).update({ ack })

        const updated = await Customchat.query().where('gupshup_gs_id', evt.gsId).update({ ack })

        console.log('✅ ACK Customchat atualizado:', { gsId: evt.gsId, eventType: evt.eventType, ack, updated })
        return
      }

      const msg: MessageLike | null = parseInbound(body)
      if (!msg) return

      await this.monitoring.handleInbound(msg)
    } catch (error) {
      console.error('Erro no processamento do webhook Gupshup:', error)
    }
  }
}

function onlyDigits(value: any) {
  return String(value ?? '').replace(/\D/g, '')
}

function getCapturePhones() {
  return String(
    Env.get('GUPSHUP_WEBHOOK_CAPTURE_PHONES', Env.get('GUPSHUP_WEBHOOK_TEST_PHONES', ''))
  )
    .split(',')
    .map((phone) => onlyDigits(phone))
    .filter(Boolean)
}

function getPayloadPhone(payload: any) {
  const p = payload?.payload || {}
  return onlyDigits(p?.sender?.phone || p?.source || p?.destination || '')
}

function truncateLogMessage(message: string) {
  const maxLength = 60000
  return message.length > maxLength ? message.slice(0, maxLength) : message
}

async function captureTestWebhookPayload(payload: any, rawBody?: string) {
  try {
    const capturePhones = getCapturePhones()
    if (!capturePhones.length) return

    const phone = getPayloadPhone(payload)
    if (!phone || !capturePhones.includes(phone)) return

    const p = payload?.payload || {}
    const message =
      rawBody && rawBody.trim()
        ? rawBody
        : JSON.stringify(payload)

    await Log.create({
      name: 'GupshupWebhookTestCapture',
      message: truncateLogMessage(message),
      description: JSON.stringify({
        phone,
        app: payload?.app || null,
        type: payload?.type || null,
        payload_type: p?.type || null,
        payload_id: p?.id || p?.gsId || null,
        captured_at: DateTime.now().toISO(),
      }),
    })
  } catch (error) {
    console.error('Erro ao capturar webhook de teste da Gupshup:', error)
  }
}

function mapEventToAck(eventTypeRaw: string): number {
  const t = String(eventTypeRaw || '').trim().toLowerCase()

  if (!t) return 0
  if (t === 'submitted' || t === 'queued' || t === 'pending') return 0
  if (t === 'sent') return 1
  if (t === 'delivered') return 2
  if (t === 'read') return 3
  if (t === 'played') return 4
  if (t === 'failed' || t === 'error' || t === 'undelivered') return 9
  return 0
}

function parseMessageEvent(payload: any): null | {
  gsId: string
  eventType: string
  destination: string
  ts: number
  raw: any
} {
  if (payload?.type !== 'message-event') return null

  const p = payload?.payload || {}
  const gsId = String(p?.gsId || p?.id || '').trim()
  const eventType = String(p?.type || '').trim()
  const destination = String(p?.destination || '').trim()
  const ts = Number(p?.payload?.ts || 0)

  if (!gsId || !eventType) return null
  return { gsId, eventType, destination, ts, raw: payload }
}

function parseInbound(payload: any): MessageLike | null {
  if (payload?.type !== 'message') return null

  const p = payload?.payload || {}
  const from = p?.sender?.phone || p?.source
  if (!from) return null

  const text =
    p?.payload?.postbackText ||
    p?.payload?.text ||
    p?.payload?.payload?.text ||
    p?.text ||
    ''

  const inboundType = String(p?.type || 'text')
  const hasMedia = inboundType !== 'text' && inboundType !== 'quick_reply'

  const gsId = p?.context?.gsId || null
  const to = p?.destination || p?.to || ''

  return {
    from: String(from),
    to: String(to),
    body: String(text),
    hasMedia,
    context: gsId ? { gsId: String(gsId) } : undefined,
    raw: payload,
  }
}
