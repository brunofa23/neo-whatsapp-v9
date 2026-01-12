import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController'
import Agent from 'App/Models/Agent'
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import Interaction from 'App/Models/Interaction'
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

function safeParseParams(jsonText: string): string[] {
  try {
    const arr = JSON.parse(jsonText || '[]')
    if (!Array.isArray(arr)) return []
    return arr.map((x) => String(x))
  } catch {
    return []
  }
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
    const agentMaxMessage = await Agent.query().where('id',agent.id).first() 
    const maxLimitSendAgent = agentMaxMessage?.max_limit_message || 0

    const isPriority = !!shippingCampaign?.prioritysend
    if (totMessageSend >= maxLimitSendAgent && !isPriority) {
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

    // ✅ busca template do interaction
    const interaction = await Interaction.query()
      .select('id_templates_gupshup')
      .where('id', shippingCampaign.interaction_id)
      .first()

    const templateId = interaction?.idTemplatesGupshup
    if (!templateId) {
      await Log.create({
        name: 'GupshupTemplateMissing',
        message: `interaction_id=${shippingCampaign.interaction_id} sem id_templates_gupshup`,
        description: `shippingcampaign_id=${shippingCampaign.id}`,
      })
      return
    }

    // ✅ params prontos no banco (JSON string)
    const params = safeParseParams(shippingCampaign.gupshupParams)
    if (params.length === 0) {
      await Log.create({
        name: 'GupshupParamsMissing',
        message: `shippingcampaign sem gupshup_params válido`,
        description: `shippingcampaign_id=${shippingCampaign.id}`,
      })
      return
    }

    // ✅ envia template via gupshup (agora pegando messageId)
    const { status, messageId } = await SendMessageGupshup({
      agent,
      destination,
      templateId,
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
      message: shippingCampaign.message, // mantém o texto “humano”
      shippingcampaigns_id: shippingCampaign.id,
      chatname: agent.name,
      chatnumber: chatnumberKey,

      // ✅ NOVO: salva id da mensagem enviada (vai bater com webhook payload.context.gsId)
      gupshup_gs_id: messageId,
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

    console.log(
      'Mensagem enviada (GUPSHUP):',
      shippingCampaign.name,
      destination,
      'agent',
      agent.name,
      'status',
      status,
      'messageId',
      messageId
    )

    // status informativo
    if (agent.statusconnected === false || agent.status !== 'GUPSHUP') {
      await Agent.query().where('id', agent.id).update({ statusconnected: true, status: 'GUPSHUP' })
    }

    return { status, messageId }
  } catch (error) {
    console.error('Erro SendFromQueueGupshup:', error)
    await Log.create({
      name: 'SendFromQueueGupshup',
      message: error?.message || String(error),
      description: error?.stack || 'Sem stack',
    })
  }
}
