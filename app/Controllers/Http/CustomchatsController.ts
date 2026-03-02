import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { DateTime } from 'luxon'
//import WhatsAppClientManager from 'App/Services/whatsapp-web/WhatsAppClientManager'
import Agent from 'App/Models/Agent'
import Talk from 'App/Models/Talk'
import Template from 'App/Models/Template'
import SendMessageGupshup from 'App/Services/whatsapp-gupshup/SendMessageGupshup'
import SendTextGupshup from 'App/Services/whatsapp-gupshup/SendTextGupshup'
import CustomchatValidator from 'App/Validators/CustomchatValidator'
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

export default class CustomchatsController {
  public async show({ auth, params, response }: HttpContextContract) {
    console.log("passei aqui....")
    await auth.use('api').authenticate()

    const query = Database.from('chats')
      .select(
        'id',
        'reg',
        'cellphone',
        'cellphoneserialized',
        'message',
        'response',
        'invalidresponse',
        'returned',
        'chatname',
        Database.raw('0 messagesent'),
        'chatnumber',
        Database.raw('0  phonevalid'),
        Database.raw('0 `read`'),
        Database.raw('0 viewed'),
        Database.raw('0 ack'),
        Database.raw('0 path_media'),
        'created_at'
      )
      .where('id', params.id)
      .union((query) => {
        query
          .from('customchats')
          .select(
            'id',
            'reg',
            'cellphone',
            'cellphoneserialized',
            'message',
            'response',
            'response',
            'returned',
            'chatname',
            'messagesent',
            'chatnumber',
            'phonevalid',
            'read',
            'viewed',
            'ack',
            'path_media',
            'created_at'
          )
          .where('chats_id', params.id)
      })

    const data = await query

    // 🕒 Cálculo da última mensagem com returned = 1
    const now = DateTime.now()

    let lastReturnedAt: DateTime | null = null

    for (const row of data) {
      // returned pode vir como number, string ou boolean dependendo do driver
      const returnedValue = row.returned

      const isReturned =
        returnedValue === 1 ||
        returnedValue === '1' ||
        returnedValue === true

      if (!isReturned) continue

      // trata created_at (pode ser Date ou string)
      let createdAt: DateTime | null = null

      if (row.created_at instanceof Date) {
        createdAt = DateTime.fromJSDate(row.created_at)
      } else if (typeof row.created_at === 'string') {
        // se no banco está como datetime padrão, isso funciona
        createdAt = DateTime.fromISO(row.created_at, { setZone: false })
        // se for outro formato, dá pra ajustar aqui depois (ex: dd/MM/yyyy HH:mm)
      }

      if (!createdAt?.isValid) continue

      if (!lastReturnedAt || createdAt > lastReturnedAt) {
        lastReturnedAt = createdAt
      }
    }

    // 🚦 Flag: se a última mensagem retornada tem mais de 24h
    let windowExpired24h = true
    let diffHours: number | null = null

    if (lastReturnedAt) {
      diffHours = now.diff(lastReturnedAt, 'hours').hours
      windowExpired24h = diffHours > 24
    } else {
      // nunca teve returned = 1 → você decide:
      // aqui estou considerando como "expirada" por padrão
      windowExpired24h = true
    }

    return response.status(200).send({
      data,
      lastReturnedAt: lastReturnedAt ? lastReturnedAt.toISO() : null,
      diffHours,              // opcional: pra debug no front
      windowExpired24h,       // true = passou de 24h, false = ainda dentro da janela
    })
  }

  public async sendMessage({ auth, request, response }: HttpContextContract) {
  await auth.use('api').authenticate()
  console.log('PASSEI AQUI')

  // Captura apenas template_id (pode vir ou não, dependendo se é envio por template)
  const { template_id } = request.only(['template_id'])

  // Valida demais campos do Customchat
  const rawBody = await request.validate(CustomchatValidator)

  // ✅ Usa o template_id vindo do request (se existir)
  //    Se vier string, converte pra number
  if (template_id !== undefined && template_id !== null && template_id !== '') {
    rawBody.template_id = Number(template_id)
  } else {
    // se não vier nada, deixa como null/undefined (sem template)
    rawBody.template_id = rawBody.template_id ?? null
  }

  // Guarda o created_at original ANTES de mexer no formattedBody
  const createdAtRaw = rawBody.created_at

  if (!rawBody.id || !rawBody.cellphoneserialized) {
    return response.badRequest({
      error: 'Campos obrigatórios ausentes (id ou cellphoneserialized).',
    })
  }

  // 🔴 IMPORTANTE:
  // NÃO obrigamos mais template_id aqui, porque você pode enviar mensagem de texto
  // mesmo dentro da janela. Se quiser tornar obrigatório em algum cenário,
  // faça a checagem com base na lógica de janela no backend.

  // Preparação base do corpo para salvar
  const formattedBody: any = {
    ...rawBody,
    cellphoneserialized: (await normalizePhoneKey(rawBody.cellphoneserialized)) || null,
    messagesent: false,
    chats_id: rawBody.id,
  }

  // Remoção de campos não permitidos ou que serão tratados separadamente
  delete formattedBody.returned
  delete formattedBody.created_at
  delete formattedBody.id
  delete formattedBody.response
  delete formattedBody.template_id   // ⚠️ não salvamos aqui, vamos controlar à parte

  try {
    // === 1) Buscar agente padrão ===
    const agent = await Agent.query().where('default_chat', true).firstOrFail()

    // === 2) Buscar o chat para pegar info do paciente / campanha ===
    const chat = await Chat.findOrFail(formattedBody.chats_id)

    const patientName =
      (chat as any).patient_name ||
      (chat as any).name ||
      (chat as any).person_name ||
      ''

    // === 3) Buscar o template na sua tabela (SE houver template_id) ===
    let template: Template | null = null
    let templateIdExternal: string | null = null

    if (rawBody.template_id) {
      template = await Template.findOrFail(rawBody.template_id)

      templateIdExternal = template.id_external

      if (!templateIdExternal) {
        throw new Error(`Template ${template.id} sem id_external configurado`)
      }
    }

    // === 4) Montar os parâmetros do template ===
    const templateParams: (string | number)[] = [
      patientName,
      // ex.: chat.doctor_name,
      // ex.: chat.schedule_date,
    ]

    // === 5) Verificar se já se passaram mais de 23 horas desde o último retorno ===
    let shouldSendTemplate = false

    if (createdAtRaw && rawBody.template_id) {
      const query = Customchat.query()
        .where('chats_id', rawBody.id)
        .where('returned', true)
        .orderBy('created_at', 'desc')

      const customChat = await query.first()
      console.log(query.toQuery())

      const createdAt = customChat?.createdAt // DateTime | undefined

      if (!createdAt) {
        shouldSendTemplate = true
        console.log('CREATED_AT NULO → shouldSendTemplate = true')
      } else if (createdAt && createdAt.isValid) {
        const diffHours = DateTime.now()
          .setZone('America/Sao_Paulo')
          .diff(createdAt, 'hours').hours

        console.log('DIFF HOURS:', diffHours)
        // Só envia template se o registro foi criado há mais de 23h
        shouldSendTemplate = diffHours > 23
      } else {
        shouldSendTemplate = false
      }
    }

    console.log('ÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇ shouldSendTemplate:', shouldSendTemplate)

    // === 6) Envia o TEMPLATE via Gupshup somente se:
    // - houver template_id
    // - shouldSendTemplate = true
    if (rawBody.template_id && templateIdExternal && shouldSendTemplate) {
      const { status, messageId } = await SendMessageGupshup({
        agent,
        destination: formattedBody.cellphoneserialized,
        templateId: templateIdExternal,  // 👈 AGORA usa id_external
        params: templateParams,
        useDefaultApiKey: true,
      })

      console.log('PASSO 1 - TEMPLATE ENVIADO....', { status, messageId })
    } else if (rawBody.template_id && !shouldSendTemplate) {
      console.log('Template NÃO enviado (menos de 23h desde created_at ou data inválida)')
    }

    // ✅ Envia texto normal via endpoint /msg (sempre que tiver message)
    if (formattedBody.message && String(formattedBody.message).trim() !== '') {
      const sendText = await SendTextGupshup({
        source: agent.gupshup_source,
        destination: formattedBody.cellphoneserialized,
        text: formattedBody.message,
        useDefaultApiKey: true,
      })
      console.log('PASSO 2 - SEND TEXT....', sendText)
    } else {
      console.log('Nenhum texto livre para enviar (message vazia).')
    }

    // Para salvar no histórico
    const mensagemParaHistorico =
      formattedBody.message ||
      (templateIdExternal
        ? `TEMPLATE ${templateIdExternal} | params: ${templateParams.join(' | ')}`
        : '')

    formattedBody.message = mensagemParaHistorico

    // === 7) Salvar registro da mensagem no Customchat ===
    let payLoad: Customchat | undefined

    try {
      payLoad = await Customchat.create({
        ...formattedBody,
        chatnumber: agent.gupshup_source,
        chatname: agent?.name,
        messagesent: true,
        template_id: rawBody.template_id || null, // 👈 salva o id do template interno, se usado
      })
      console.log('RETORNO:', agent.name)
    } catch (error) {
      console.log('Erro ao salvar Customchat:', error)
    }

    // === 8) Registrar na Talk (histórico de conversas) ===
    await Talk.create({
      chat_id: formattedBody.chats_id,
      reg: formattedBody.reg,
      cellphone: formattedBody.cellphoneserialized,
      message: mensagemParaHistorico,
      chatnumber: agent.gupshup_source,
      type: 'to',
    })

    // === 9) Atualizar a resposta no chat ===
    await Chat.query()
      .where('id', formattedBody.chats_id)
      .update({ last_response: 1 })

    // === 10) Atualizar primeiro retorno de campanha, se aplicável ===
    if (chat.shippingcampaigns_id) {
      const shippingcampaign = await Shippingcampaign.find(chat.shippingcampaigns_id)

      if (shippingcampaign && !shippingcampaign.date_first_return) {
        shippingcampaign.date_first_return = DateTime.now().setZone('America/Sao_Paulo')
        await shippingcampaign.save()
      }
    }

    // Retorno final
    return response.status(201).send(payLoad || formattedBody)
  } catch (error) {
    console.log('ERRO GUPSHUP DATA >>>', (error as any).response?.data)
    console.error('Erro ao enviar mensagem Gupshup:', error)

    return response
      .status(500)
      .send({ error: `Falha ao enviar mensagem via Gupshup. ERRO: ${error}` })
  }
}

  public async viewedConfirmed({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await Customchat.query()
        .where('chats_id', params.chats_id)
        .update({ viewed: true })

      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }
}
