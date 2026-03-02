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
import { dirname } from 'path'
import Customchat from 'App/Models/Customchat'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {
    // pega payload já parseado
    const payload = request.all()

    // nome do app (ex: "Digi3Sistemas6")
    const appName: string = String(payload.app || '').trim()

    // body cru
    const rawBody = request.raw()

    // 🔍 LOGA O RAW APENAS QUANDO FOR Digi3Sistemas6
    if (appName === 'Digi3Sistemas6') {
      console.log('=== GUPSHUP WEBHOOK RAW STRING ===')
      console.log(rawBody)
      console.log('=== FIM RAW STRING ===')
    }

    // responde rápido
    response.status(200).send({ ok: true })

    try {
      // ✅ DOWNLOAD DE ÁUDIO (mensagens inbound de áudio)
      // ✅ NOVO COMPORTAMENTO: se vier SOMENTE áudio, cria um NOVO registro em Customchats com path_media
      if (payload?.type === 'message' && payload?.payload?.type === 'audio') {
        const audioPayload = payload.payload?.payload
        const url: string | undefined = audioPayload?.url
        const contentType: string = audioPayload?.contentType || ''

        // 👉 aqui reutiliza o appName já calculado lá em cima
        const dialCode: string = String(payload.payload?.sender?.dial_code || '').trim()

        if (!url) {
          console.log('⚠️ Áudio recebido mas sem URL no payload.')
          return
        }

        const extension =
          contentType.includes('ogg') ? 'ogg' : contentType.includes('mpeg') ? 'mp3' : 'bin'

        // ✅ sanitiza id para não salvar com "=" e caracteres ruins
        const messageId = String(payload.payload?.id || Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName = `${messageId}.${extension}`

        // 🟢 salva em: <root>/Medias/Customchats/<fileName>
        const filePath = Application.makePath(`Medias/Customchats/${fileName}`)
        await fs.mkdir(dirname(filePath), { recursive: true })

        // ✅ baixa o binário e valida resposta (não salva lixo como .ogg)
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

        // ✅ se for ogg, valida header "OggS"
        if (extension === 'ogg') {
          const magic = buf.slice(0, 4).toString('ascii')
          if (magic !== 'OggS') {
            console.log('❌ Conteúdo baixado não parece OGG (header inválido)', { magic, ct })
            return
          }
        }

        await fs.writeFile(filePath, buf)
        console.log('🎧 Áudio Gupshup salvo em:', filePath, 'CT:', ct)

        // No banco, só o nome do arquivo
        const relativeFileName = fileName

        // ✅ cria um NOVO registro (não atualiza o último)
        console.log('🟢 Criando novo Customchat só com áudio:', { appName, dialCode, relativeFileName })

        await Customchat.create({
          chatname: appName,
          cellphoneserialized: dialCode,
          path_media: relativeFileName,
          // demais campos ficam default/null conforme sua tabela
        })

        console.log('✅ Novo Customchat criado com path_media.')

        // ✅ não deixa cair no parseInbound/monitoring
        return
      }

      // ✅ 1) Eventos de status/ack (read/delivered/sent/played/failed...)
      const evt = parseMessageEvent(payload)
      if (evt) {
        const ack = mapEventToAck(evt.eventType)
        await Chat.query().where('gupshup_gs_id', evt.gsId).update({ ack })
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
