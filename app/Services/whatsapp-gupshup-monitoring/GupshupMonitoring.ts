// app/Services/whatsapp-gupshup-monitoring/GupshupMonitoring.ts
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'


// ✅ ConfirmSchedule exclusivo do Gupshup (sem whatsapp-web.js)
import ConfirmScheduleGupshup from './ConfirmScheduleGupshup'

function onlyDigits(v: any) {
  return String(v ?? '').replace(/\D/g, '')
}

/**
 * Busca o chat pendente (mesma regra usada no whatsapp-web.js):
 * - celular do paciente (cellphoneserialized)
 * - número do agente/WABA (chatnumber)
 * - último registro
 * - response ainda nula (pendente)
 */
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
  /**
   * Entrada única do webhook (MessageLike já parseado)
   */
  public async handleInbound(message: any) {
    const fromDigits = onlyDigits(message.from)
    const toDigits = onlyDigits(message.to)
    const body = String(message.body || '')
    const hasMedia = !!message.hasMedia

    // ✅ log rápido pra depuração
    await Log.create({
      name: 'gupshup_inbound',
      message: JSON.stringify({
        at: DateTime.now().toISO(),
        from: fromDigits,
        to: toDigits,
        body: body.slice(0, 200),
        hasMedia,
      }),
      description: 'GUPSHUP WEBHOOK INBOUND',
    })

    // ✅ registra inbound no talk
    await Talk.create({
      cellphone: fromDigits,
      chatnumber: toDigits,
      message: body.slice(0, 999),
      type: 'from',
    })

    // ✅ tenta localizar chat pendente
    const chat = await getChat(fromDigits, toDigits)

    console.log('GUPSHUP MONITORING => chat encontrado?', !!chat, 'from', fromDigits, 'to', toDigits)

    if (!chat) {
      // aqui você pode escolher:
      // 1) ignorar
      // 2) responder "não encontrei campanha ativa"
      // 3) cair no seu fluxo de IA
      return
    }

    // ✅ apenas fluxo 1 por enquanto
    if (chat.interaction_id === 1) {
      console.log("PASSEI AQUI@@@@@@@@@@@@@@@@@", fromDigits, "-",toDigits,'"-"',body, "hasmedia",hasMedia, "chat:")
      await ConfirmScheduleGupshup(
        {
          from: fromDigits,
          to: toDigits,
          body,
          hasMedia,
        },
        chat
      )
      return
    }

    // ✅ preparado pros próximos fluxos (quando você quiser)
    // if (chat.interaction_id === 2) {
    //   await ServiceEvaluationGupshup({ from: fromDigits, to: toDigits, body, hasMedia }, chat)
    // }
  }
}
