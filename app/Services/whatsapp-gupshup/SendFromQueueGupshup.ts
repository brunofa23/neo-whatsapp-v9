import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController'
import Agent from 'App/Models/Agent'
import Chat from 'App/Models/Chat'
import Talk from 'App/Models/Talk'
import Log from 'App/Models/Log'
import Interaction from 'App/Models/Interaction'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { DateTime } from 'luxon'

// ✅ tudo do util em um único import
import { TimeSchedule, ValidatePhone, normalizePhoneKey } from 'App/Services/whatsapp-web/util'

// ✅ import do sender Gupshup
import SendMessageGupshup from 'App/Services/whatsapp-gupshup/SendMessageGupshup'

const shippingcampaignsController = new ShippingcampaignsController()
const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')

function onlyDigits(v: string) {
  return String(v || '').replace(/\D/g, '')
}

async function verifyClientSend(chatnumberKey: string, cellphone: string) {
  const query =Chat.query()
    .where('cellphone', cellphone)
    .andWhere('created_at', '>', dayBefore5)
    .andWhere('chatnumber', chatnumberKey)
  console.log(query.toQuery())


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

/**
 * 🔹 Conta quantas mensagens já foram enviadas HOJE para uma determinada interaction
 *    usando Shippingcampaign (messagesent = true) filtrando por updated_at (momento do envio).
 */
/**
 * 🔹 Conta quantas mensagens já foram enviadas HOJE para uma determinada interaction
 *    usando Shippingcampaign (messagesent = true)
 *    filtrando por created_at (data de criação do registro)
 */
async function countCampaignSentToday(interactionId: number): Promise<number> {
  const start = DateTime.local().startOf('day').toSQL({ includeOffset: false })
  const end = DateTime.local().endOf('day').toSQL({ includeOffset: false })

  const result = await Shippingcampaign.query()
    .where('interaction_id', interactionId)
    .andWhere('messagesent', true)
    .andWhere('created_at', '>=', start)
    .andWhere('created_at', '<=', end)
    .count('* as total')

  const row = result[0]
  const total =
    row && row.$extras && row.$extras.total != null
      ? Number(row.$extras.total)
      : 0

  return total
}


export default async function SendFromQueueGupshup(agent: Agent) {
 
  try {
    // horário permitido
    if ((await TimeSchedule()) === false) return

    // pega próxima campanha (sua regra central)
    const shippingCampaign = await shippingcampaignsController.patientToSend(agent)
    if (!shippingCampaign) return

    const isPriority = !!shippingCampaign?.prioritysend

    // chave do canal (equivalente ao wid.user do wwebjs)
    const chatnumberKey = onlyDigits(agent.gupshup_source || '')
    if (!chatnumberKey) {
      // await Log.create({
      //   name: 'Gupshup',
      //   message: 'Agent sem gupshup_source',
      //   description: `SendFromQueueGupshup AgentId=${agent.id}`,
      // })
      return
    }

    console.log('PASSO 1')
    // =====================================================
    // 🔹 LIMITE DIÁRIO POR AGENTE
    // =====================================================
    const totMessageSend = await shippingcampaignsController.maxLimitSendMessage(agent)
    const agentMaxMessage = await Agent.query().where('id', agent.id).first()
    const maxLimitSendAgent = agentMaxMessage?.max_limit_message || 0

    if (totMessageSend >= maxLimitSendAgent && !isPriority) {
      console.log(
        `LIMITE DIÁRIO ATINGIDO (AGENTE / GUPSHUP), Id:${agent.id} Agent:${agent.name} Enviados:${totMessageSend} - Limite:${maxLimitSendAgent}`
      )
      return
    }

    // =====================================================
    // 🔹 BUSCA INTERACTION PELO ID (tabela interactions)
    //    e pega template + maxsendlimit (limite diário da campanha)
    // =====================================================
    const interaction = await Interaction.query()
      .select('id', 'id_templates_gupshup', 'maxsendlimit')
      .where('id', shippingCampaign.interaction_id)
      .first()

    if (!interaction) {
      // await Log.create({
      //   name: 'InteractionMissing',
      //   message: `interaction_id=${shippingCampaign.interaction_id} não encontrada`,
      //   description: `shippingcampaign_id=${shippingCampaign.id}`,
      // })
      return
    }

    console.log('PASSO 2')
    const templateId = interaction.idTemplatesGupshup
    if (!templateId) {
      // await Log.create({
      //   name: 'GupshupTemplateMissing',
      //   message: `interaction_id=${interaction.id} sem id_templates_gupshup`,
      //   description: `shippingcampaign_id=${shippingCampaign.id}`,
      // })
      return
    }

    const maxLimitCampaign = Number(interaction.maxsendlimit || 0)

    // =====================================================
    // 🔹 LIMITE DIÁRIO POR CAMPANHA (Interaction.maxsendlimit)
    // =====================================================
    if (maxLimitCampaign > 0 && !isPriority) {
      const totCampaignSentToday = await countCampaignSentToday(Number(shippingCampaign.interaction_id))

      if (totCampaignSentToday >= maxLimitCampaign) {
        console.log(
          `LIMITE DIÁRIO ATINGIDO (CAMPANHA / interaction_id=${shippingCampaign.interaction_id}) EnviadosHoje:${totCampaignSentToday} - Limite:${maxLimitCampaign}`
        )
        return
      }
    }

    console.log('PASSO 3')
    // evita enviar repetido pro mesmo paciente em 5 dias (quando não é prioridade)
    // if (!shippingCampaign.prioritysend) {
    //   const already = await verifyClientSend(chatnumberKey, shippingCampaign.cellphone)
    //   console.log('PASSO 4')
    //   if (already) return
    // }

    // não duplicar se já existe chat salvo pra esse shippingcampaign
    const chatExists = await verifyChatAlreadySaved(shippingCampaign)
    console.log('PASSO 5')
    if (chatExists) return

    // =====================================================
    // DESTINATION: usa cellphone + ValidatePhone para envio
    // e JÁ gera a chave técnica para correlação (cellphoneserialized)
    // =====================================================

    // usamos o valor como está cadastrado (normalizePhoneKey já limpa dígitos por dentro)

    const phoneKey = normalizePhoneKey(shippingCampaign.cellphone)
    if (!phoneKey) {
      // await Log.create({
      //   name: 'GupshupPhoneKeyError',
      //   message: `Não foi possível gerar cellphoneserialized para "${shippingCampaign.cellphone}"`,
      //   description: `shippingcampaign_id=${shippingCampaign.id}`,
      // })
      // marca como inválido e sai
      shippingCampaign.phonevalid = false
      shippingCampaign.cellphoneserialized = null
      await shippingCampaign.save()
      return
    }

    // validação de telefone para envio (E.164) – ValidatePhone já remove não-dígitos
    const normalized = await ValidatePhone(shippingCampaign.cellphone)

    if (!normalized) {
      // número não é celular válido → marca como inválido e sai
      shippingCampaign.phonevalid = false
      // ainda assim gravamos a chave pra rastrear
      shippingCampaign.cellphoneserialized = phoneKey
      await shippingCampaign.save()
      return
    }

    const destination = normalized

    // ✅ params prontos no banco (JSON string)
    const params = safeParseParams(shippingCampaign.gupshupParams)
    if (params.length === 0) {
      // await Log.create({
      //   name: 'GupshupParamsMissing',
      //   message: `shippingcampaign sem gupshup_params válido`,
      //   description: `shippingcampaign_id=${shippingCampaign.id}`,
      // })
      return
    }

    // ✅ envia template via gupshup (pegando messageId)
    console.log('CHEGUEI AQUI 122@@@@@')
    //*******************************
    const { status, messageId } = await SendMessageGupshup({
      agent,
      destination,
      templateId,
      params,
    })

    // ✅ grava status e histórico
    shippingCampaign.messagesent = true
    shippingCampaign.phonevalid = true
    // ✅ grava também a chave técnica (normalizada com normalizePhoneKey)
    shippingCampaign.cellphoneserialized = phoneKey
    await shippingCampaign.save()

    const bodyChat = {
      interaction_id: shippingCampaign.interaction_id,
      interaction_seq: shippingCampaign.interaction_seq,
      idexternal: shippingCampaign.idexternal,
      reg: shippingCampaign.reg,
      name: shippingCampaign.name,

      cellphone: shippingCampaign.cellphone,
      // ✅ chave para encontrar o chat pelo webhook (from -> normalizePhoneKey)
      cellphoneserialized: phoneKey,

      message: shippingCampaign.message,
      shippingcampaigns_id: shippingCampaign.id,
      chatname: agent.name,
      chatnumber: chatnumberKey,

      // id da mensagem enviada (gsId) pra bater com webhook de "message-event" ou context.gsId
      gupshup_gs_id: messageId,
    }

    const chat = await Chat.create(bodyChat)

    await Talk.create({
      cellphone: destination, // destino efetivamente usado na API
      cellphoneserialized: phoneKey,
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
    // await Log.create({
    //   name: 'SendFromQueueGupshup',
    //   message: error?.message || String(error),
    //   description: error?.stack || 'Sem stack',
    // })
  }
}
