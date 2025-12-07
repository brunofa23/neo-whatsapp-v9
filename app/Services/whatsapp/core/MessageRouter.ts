// app/Services/whatsapp/core/MessageRouter.ts

import Talk from 'App/Models/Talk'
import { WaInboundMessage } from './IWhatsAppProvider'
import whatsAppEngine from './WhatsAppEngine'

/**
 * Router simples de mensagens.
 *
 * Nesta primeira versão:
 *  - ignora mensagens de broadcast/status
 *  - guarda a mensagem na tabela Talk
 *  - envia uma resposta simples "Eco" para testar o fluxo completo
 *
 * Depois vamos evoluir esse Router para incorporar a lógica do seu ChatMonitoring.
 */
export default class MessageRouter {
  /**
   * Trata uma mensagem que chegou (inbound) de QUALQUER provider.
   */
  public async handleInbound(msg: WaInboundMessage) {
    // 1) Filtrar coisas que não queremos responder
    if (this.shouldIgnore(msg)) {
      return
    }

    // 2) Persiste na Talk (bem simples por enquanto)
    await Talk.create({
      cellphone: msg.from,
      chatnumber: msg.to,
      message_ack: 0,
      message: msg.body.slice(0, 999),
      type: 'from',
    })

    // 3) Responde algo simples usando o próprio engine
    const resposta = `Recebido pelo novo engine (${msg.provider}) -> "${msg.body}"`

    await whatsAppEngine.sendText(msg.agentId, msg.from, resposta)

    await Talk.create({
      cellphone: msg.from,
      chatnumber: msg.to,
      message_ack: 0,
      message: resposta.slice(0, 999),
      type: 'to',
    })
  }

  /**
   * Filtro simples para ignorar mensagens que não interessam.
   * Mais tarde podemos incorporar o mesmo critério do seu ChatMonitoring:
   * - status
   * - broadcast
   * - mídia sem texto, etc.
   */
  private shouldIgnore(msg: WaInboundMessage): boolean {
    // ignorar se não tiver body e nem media
    if (!msg.body && !msg.hasMedia) return true

    // ignorar se for status/broadcast (padrão desses sufixos)
    if (msg.from.includes('@broadcast') || msg.from.includes('@status')) return true

    return false
  }
}
