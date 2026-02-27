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
import { join, dirname } from 'path'
import Customchat from 'App/Models/Customchat'

export default class GupshupWebhookController {
  private monitoring = new GupshupMonitoring()

  public async handle({ request, response }: HttpContextContract) {

    // 🔴 body cru exatamente como a Gupshup manda (igual webhook.site)
    const rawBody = request.raw()
    console.log('=== GUPSHUP WEBHOOK RAW STRING ===')
    console.log(rawBody)
    console.log('=== FIM RAW STRING ===')

    const payload = request.all()

    // ✅ responde 200 rápido
    response.status(200).send({ ok: true })

    try {
      // ✅ DOWNLOAD DE ÁUDIO (mensagens inbound de áudio)
      // ✅ DOWNLOAD DE ÁUDIO (mensagens inbound de áudio)
      if (payload?.type === 'message' && payload?.payload?.type === 'audio') {
        const audioPayload = payload.payload?.payload
        const url: string | undefined = audioPayload?.url
        const contentType: string = audioPayload?.contentType || ''

        const appName: string = String(payload.app || '').trim()
        const dialCode: string = String(payload.payload?.sender?.dial_code || '').trim()

        if (url) {
          const extension =
            contentType.includes('ogg') ? 'ogg'
              : contentType.includes('mpeg') ? 'mp3'
                : 'bin'

          const messageId = String(payload.payload?.id || Date.now())
          const fileName = `${messageId}.${extension}`

          // 🔴 PRESTA ATENÇÃO AQUI:
          // Vai salvar em: <root-do-projeto>/Medias/Customchats/arquivo.ogg
          const filePath = Application.makePath(`Medias/Customchats/${fileName}`)

          await fs.mkdir(path.dirname(filePath), { recursive: true })

          const { data } = await axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer',
          })

          await fs.writeFile(filePath, Buffer.from(data))

          console.log('🎧 Áudio Gupshup salvo em:', filePath)

          // NO BANCO, SÓ O NOME DO ARQUIVO:
          const relativeFileName = fileName

          const existing = await Customchat.query()
            .where('cellphoneserialized', dialCode)
            .andWhere('chatname', appName)
            .whereNull('returned')
            .orderBy('created_at', 'desc')
            .first()

          if (existing) {
            existing.merge({ path_media: relativeFileName })
            await existing.save()
          }
        }
      }

      // ✅ 1) Eventos de status/ack (read/delivered/sent/played/failed...)
      const evt = parseMessageEvent(payload)
      if (evt) {
        const ack = mapEventToAck(evt.eventType)

        // salva ack no chat pelo gsId (que é o messageId do envio)
        const updated = await Chat.query()
          .where('gupshup_gs_id', evt.gsId)
          .update({
            ack,
            // opcional: se você tiver esses campos, descomente/ajuste
            // ack_date: DateTime.fromSeconds(evt.ts || DateTime.now().toSeconds()).toFormat('yyyy-MM-dd HH:mm'),
          })

        // se quiser logar quando não encontrar chat, reativa o bloco abaixo
        // if (!updated) {
        //   await Log.create({
        //     name: 'gupshup_message_event_unmatched',
        //     message: JSON.stringify({
        //       at: DateTime.now().toISO(),
        //       gsId: evt.gsId,
        //       eventType: evt.eventType,
        //       ack,
        //       destination: evt.destination,
        //       ts: evt.ts,
        //     }),
        //     description: 'Evento de mensagem sem chat correspondente (gupshup_gs_id não encontrado)',
        //   })
        // }

        return
      }

      // ✅ 2) Mensagens inbound (texto / quick_reply / media)
      const msg: MessageLike | null = parseInbound(payload)
      if (!msg) return

      await this.monitoring.handleInbound(msg)
    } catch (error) {
      // await Log.create({
      //   name: 'GupshupWebhookError',
      //   message: error?.message || String(error),
      //   description: error?.stack || 'Sem stack',
      // })
      console.log('código 155478:', error)
    }
  }
}

function mapEventToAck(eventTypeRaw: string): number {
  const t = String(eventTypeRaw || '').trim().toLowerCase()

  // seu pedido:
  // pendente=0, entregue=1, chegou no dispositivo=2, lida=3, played=4
  //
  // mapeamento prático com os nomes comuns da Gupshup:
  if (!t) return 0

  // "read" -> lida
  if (t === 'read') return 3

  // "played" -> played (áudio)
  if (t === 'played') return 4

  // "delivered" -> entregue (whatsapp entregou)
  if (t === 'delivered') return 1

  // "sent" -> não é "read", mas já saiu/chegou no dispositivo em muitos fluxos
  // (melhor aproximação para o seu ack=2)
  if (t === 'sent') return 2

  // estados pendentes
  if (t === 'submitted' || t === 'queued' || t === 'pending') return 0

  // falha: mantém 0 (pendente/sem confirmação). Se você quiser, pode usar -1.
  if (t === 'failed' || t === 'error' || t === 'undelivered') return 0

  // fallback: não reconhecido -> 0
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

// ✅ seu parseInbound (com fallback extra)
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
