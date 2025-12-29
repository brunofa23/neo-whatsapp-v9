import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController'
import Agent from 'App/Models/Agent'
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import { DateTime } from 'luxon'
import { TimeSchedule } from 'App/Services/whatsapp-web/util'
import SendMessageGupshup from 'App/Services/whatsapp-gupshup/SendMessageGupshup'

const shippingcampaignsController = new ShippingcampaignsController()
const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')

function onlyDigits(v: string) {
  return String(v || '').replace(/\D/g, '')
}

async function verifyClientSend(chatnumberKey: string, cellphone: string) {
  return Chat.query()
    .where('cellphone', cellphone)
    .andWhere('created_at', '>', dayBefore5)
    .andWhere('chatnumber', chatnumberKey)
    .first()
}

async function verifyChatAlreadySaved(shippingCampaign: any) {
  return Chat.query()
    .where('interaction_id', shippingCampaign?.interaction_id)
    .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
    .andWhere('shippingcampaigns_id', shippingCampaign?.id)
    .andWhereNull('excluded')
    .first()
}

function buildTemplateParams(sc: any) {
  // ✅ exatamente conforme seu template exemplo:
  // ["Bruno Favato","26/12/2025 14:30","Unidade Centro","Dr. João Silva"]
  const name = String(sc.name || '').trim()

  const dt =
    sc.dateshedule
      ? DateTime.fromJSDate(sc.dateshedule).setZone('America/Sao_Paulo').toFormat('dd/MM/yyyy HH:mm')
      : ''

  const unit = String(sc.unit || '').trim()
  const doctor = String(sc.doctor || '').trim()

  return [name, dt, unit, doctor]
}

export default async function SendFromQueueGupshup(agent: Agent) {
  try {
    // horário permitido
    if ((await TimeSchedule()) === false) return

    // pega próxima campanha (sua regra central)
    const shippingCampaign = await shippingcampaignsController.patientToSend(agent)
    if (!shippingCampaign) return

    // chave do canal (equivalente ao wid.user do wwebjs)
    const chatnumberKey = onlyDigits(agent.gupshup_source || '')
    if (!chatnumberKey) {
      await Log.create({
        name: 'Gupshup',
        message: 'Agent sem gupshup_source',
        description: `SendFromQueueGupshup AgentId=${agent.id}`,
      })
      return
    }

    // limite diário (mesma lógica do seu SendMessage atual)
    const totMessageSend = await shippingcampaignsController.maxLimitSendMessage(agent)
    const maxLimitSendAgent = agent.max_limit_message || 0

    if (
      totMessageSend >= maxLimitSendAgent &&
      (shippingCampaign?.prioritysend === null ||
        shippingCampaign?.prioritysend === undefined ||
        shippingCampaign?.prioritysend === false)
    ) {
      console.log(
        `LIMITE DIÁRIO ATINGIDO (GUPSHUP), Id:${agent.id} Agent:${agent.name} Enviados:${totMessageSend} - Limite:${maxLimitSendAgent}`
      )
      return
    }

    // evita enviar repetido pro mesmo paciente em 5 dias
    if (!shippingCampaign.prioritysend) {
      const already = await verifyClientSend(chatnumberKey, shippingCampaign.cellphone)
      if (already) return
    }

    // não duplicar se já existe chat salvo pra esse shippingcampaign
    const chatExists = await verifyChatAlreadySaved(shippingCampaign)
    if (chatExists) return

    // destination vem do seu persist já limpo
    const destination = onlyDigits(shippingCampaign.cellphone)
    if (!destination) {
      shippingCampaign.phonevalid = false
      await shippingCampaign.save()
      return
    }

    // params do template
    const params = buildTemplateParams(shippingCampaign)

    // ✅ envia template via gupshup
    const response = await SendMessageGupshup({
      agent,
      destination,
      params,
    })

    // ✅ grava status e histórico (espelhando seu wwebjs)
    shippingCampaign.messagesent = true
    shippingCampaign.phonevalid = true
    shippingCampaign.cellphoneserialized = destination
    await shippingCampaign.save()

    const bodyChat = {
      interaction_id: shippingCampaign.interaction_id,
      interaction_seq: shippingCampaign.interaction_seq,
      idexternal: shippingCampaign.idexternal,
      reg: shippingCampaign.reg,
      name: shippingCampaign.name,
      cellphone: shippingCampaign.cellphone,
      cellphoneserialized: destination,
      message: shippingCampaign.message, // você já guarda a msg no banco
      shippingcampaigns_id: shippingCampaign.id,
      chatname: agent.name,
      chatnumber: chatnumberKey,
    }

    const chat = await Chat.create(bodyChat)

    await Talk.create({
      cellphone: destination,
      chatnumber: chatnumberKey,
      reg: shippingCampaign.reg,
      chat_id: chat.id,
      message: String(shippingCampaign.message || '').slice(0, 999),
      type: 'to',
    })

    console.log('Mensagem enviada (GUPSHUP):', shippingCampaign.name, destination, 'agent', agent.name)

    // status informativo
    if (agent.statusconnected === false || agent.status !== 'GUPSHUP') {
      await Agent.query().where('id', agent.id).update({ statusconnected: true, status: 'GUPSHUP' })
    }

    return response
  } catch (error) {
    console.error('Erro SendFromQueueGupshup:', error)
    await Log.create({
      name: 'SendFromQueueGupshup',
      message: error?.message || String(error),
      description: error?.stack || 'Sem stack',
    })
  }
}
