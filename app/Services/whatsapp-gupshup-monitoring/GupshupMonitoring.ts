// app/Services/whatsapp-gupshup-monitoring/GupshupMonitoring.ts
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'
import ConfirmSchedule from '../whatsapp-web/ChatMonitoring/ConfirmSchedule'
import { MessageLike } from './types'
import GupshupSender from './GupshupSender'

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

async function getChat(cellphone: string, agentPhone: string) {
  const phoneAgent = onlyDigits(agentPhone)
  return await Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', cellphone)
    .andWhere('chatnumber', phoneAgent)
    .orderBy('created_at', 'desc')
    .whereNull('response')
    .first()
}

export default class GupshupMonitoring {
  private sender = new GupshupSender()

  public async handleInbound(message: MessageLike) {
    const fromDigits = onlyDigits(message.from)
    const toDigits = onlyDigits(message.to)

    // logzinho básico pra depurar
    await Log.create({
      name: 'gupshup_inbound',
      message: JSON.stringify({ from: message.from, to: message.to, body: message.body?.slice?.(0, 120) }),
      description: 'GUPSHUP WEBHOOK INBOUND',
    })

    // salva talk do inbound
    await Talk.create({
      cellphone: fromDigits,
      chatnumber: toDigits,
      message: (message.body || '').slice(0, 999),
      type: 'from',
    })

    const chat = await getChat(fromDigits, toDigits)

    if (!chat) {
      // aqui você decide: ignora, responde padrão, ou cai no seu fluxo de IA depois
      return
    }

    // CHAVE: chamar seu handler existente, mas sem client do whatsapp-web.js
    // vamos passar um "client fake" só com sendMessage
    const clientLike = {
      sendMessage: async (to: string, text: string) => this.sender.sendText(to, text),
    } as any

    // adaptar "message.from" e "message.to" pro formato que seu handler espera
    const msgLikeForConfirm = {
      from: fromDigits,      // você pode manter como digits
      to: toDigits,
      body: message.body,
      hasMedia: message.hasMedia,
    } as any

    // fluxo 1 (confirm schedule)
    if (chat.interaction_id === 1) {
      await ConfirmSchedule(clientLike, msgLikeForConfirm, chat)
      return
    }

    // outros fluxos depois…
    // if (chat.interaction_id === 2) ...
  }
}
