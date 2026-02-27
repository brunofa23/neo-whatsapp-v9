// app/Controllers/Http/Webhooks/GupshupWebhookController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GupshupMonitoring from 'App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring'
import { MessageLike } from 'App/Services/whatsapp-gupshup-monitoring/types'
import Chat from 'App/Models/Chat'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'

import axios from 'axios'
import Application from '@ioc:Adonis/Core/Application'
import { promises as fs } from 'fs'
import { dirname } from 'path'   // ✅ usa só dirname
import Customchat from 'App/Models/Customchat'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {
    // body cru
    const rawBody = request.raw()
    console.log('=== GUPSHUP WEBHOOK RAW STRING ===')
    console.log(rawBody)
    console.log('=== FIM RAW STRING ===')

    const payload = request.all()

    // responde rápido
    response.status(200).send({ ok: true })

    try {
      // ✅ DOWNLOAD DE ÁUDIO (mensagens inbound de áudio)
      if (payload?.type === 'message' && payload?.payload?.type === 'audio') {
        const audioPayload = payload.payload?.payload
        const url: string | undefined = audioPayload?.url
        const contentType: string = audioPayload?.contentType || ''

        const appName: string = String(payload.app || '').trim()                     // ex.: 'Digi3Sistemas6'
        const dialCode: string = String(payload.payload?.sender?.dial_code || '').trim() // ex.: '3185228619'

        if (url) {
          const extension =
            contentType.includes('ogg') ? 'ogg'
            : contentType.includes('mpeg') ? 'mp3'
            : 'bin'

          const messageId = String(payload.payload?.id || Date.now())
          const fileName = `${messageId}.${extension}`

          // 🟢 salva em: <root>/Medias/Customchats/<fileName>
          const filePath = Application.makePath(`Medias/Customchats/${fileName}`)

          // 🔧 CORREÇÃO: usar dirname() importado, não path.dirname
          await fs.mkdir(dirname(filePath), { recursive: true })

          const { data } = await axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer',
          })

          await fs.writeFile(filePath, Buffer.from(data))

          console.log('🎧 Áudio Gupshup salvo em:', filePath)

          // No banco, só o nome do arquivo
          const relativeFileName = fileName

          console.log('🔎 Tentando localizar Customchat com:', {
            appName,
            dialCode,
          })

          const existing = await Customchat.query()
            .where('cellphoneserialized', dialCode)
            .andWhere('chatname', appName)
            .whereNull('returned')
            .orderBy('created_at', 'desc')
            .first()

          if (existing) {
            console.log('✅ Customchat encontrado, id:', existing.id)
            existing.merge({ path_media: relativeFileName })
            await existing.save()
            console.log('✅ path_media atualizado no Customchat.')
          } else {
            console.log(
              '⚠️ Nenhum Customchat encontrado para esse dialCode/appName; só salvei o arquivo em disco.'
            )
          }
        }
      }

      // ✅ 1) Eventos de status/ack (read/delivered/sent/played/failed...)
      const evt = parseMessageEvent(payload)
      if (evt) {
        const ack = mapEventToAck(evt.eventType)

        await Chat.query()
          .where('gupshup_gs_id', evt.gsId)
          .update({
            ack,
          })

        return
      }

      // ✅ 2) Mensagens inbound (texto / quick_reply / media)
      const msg: MessageLike | null = parseInbound(payload)
      if (!msg) return

      await this.monitoring.handleInbound(msg)
    } catch (error) {
      console.log('código 155478:', error)
    }
  }
}

function mapEventToAck(eventTypeRaw: string): number {
  const t = String(eventTypeRaw || '').trim().toLowerCase()

  if (!t) return 0
  if (t === 'read') return 3
  if (t === 'played') return 4
  if (t === 'delivered') return 1
  if (t === 'sent') return 2
  if (t === 'submitted' || t === 'queued' || t === 'pending') return 0
  if (t === 'failed' || t === 'error' || t === 'undelivered') return 0
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
  const gsId = String(p?.gsId || '').trim()
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
