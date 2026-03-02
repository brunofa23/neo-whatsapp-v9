// app/Controllers/Http/CustomchatsController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { DateTime } from 'luxon'
import Agent from 'App/Models/Agent'
import Talk from 'App/Models/Talk'
import Template from 'App/Models/Template'
import SendMessageGupshup from 'App/Services/whatsapp-gupshup/SendMessageGupshup'
import SendTextGupshup from 'App/Services/whatsapp-gupshup/SendTextGupshup'
import CustomchatValidator from 'App/Validators/CustomchatValidator'
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

// 🧠 Helper: monta params dinamicamente com base em params_schema do template
function buildTemplateParams(
  template: Template,
  chat: Chat,
  formattedBody: any
): (string | number)[] {
  if (!template.params_schema) return []

  let schema: string[]
  try {
    schema = JSON.parse(template.params_schema)
  } catch (e) {
    console.error('params_schema inválido para template', template.id, template.params_schema)
    return []
  }

  const params: (string | number)[] = []

  const patientName =
    (chat as any).patient_name ||
    (chat as any).name ||
    (chat as any).person_name ||
    ''

  const reg = (chat as any).reg || formattedBody.reg || ''

  const cellphone =
    formattedBody.cellphoneserialized ||
    (chat as any).cellphone ||
    ''

  const dataRegistro = (chat as any).createdAt
    ? (chat as any).createdAt.toFormat('dd/MM/yyyy')
    : ''

  const doctorName = (chat as any).doctor_name || ''
  const companyName = (chat as any).company_name || ''

  for (const key of schema) {
    if (!key) {
      params.push('')
      continue
    }

    if (key.startsWith('literal:')) {
      params.push(key.replace('literal:', ''))
      continue
    }

    switch (key) {
      case 'patient_name':
        params.push(patientName)
        break

      case 'data_registro':
        params.push(dataRegistro)
        break

      case 'reg':
        params.push(reg)
        break

      case 'cellphone':
        params.push(cellphone)
        break

      case 'doctor_name':
        params.push(doctorName)
        break

      case 'company_name':
        params.push(companyName)
        break

      default:
        console.warn(`Parâmetro de template desconhecido: ${key}`)
        params.push('')
        break
    }
  }

  return params
}

export default class CustomchatsController {
  public async show({ auth, params, response }: HttpContextContract) {
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
      const returnedValue = row.returned

      const isReturned =
        returnedValue === 1 ||
        returnedValue === '1' ||
        returnedValue === true

      if (!isReturned) continue

      let createdAt: DateTime | null = null

      if (row.created_at instanceof Date) {
        createdAt = DateTime.fromJSDate(row.created_at)
      } else if (typeof row.created_at === 'string') {
        createdAt = DateTime.fromISO(row.created_at, { setZone: false })
      }

      if (!createdAt?.isValid) continue

      if (!lastReturnedAt || createdAt > lastReturnedAt) {
        lastReturnedAt = createdAt
      }
    }

    let windowExpired24h = true
    let diffHours: number | null = null

    if (lastReturnedAt) {
      diffHours = now.diff(lastReturnedAt, 'hours').hours
      windowExpired24h = diffHours > 24
    } else {
      windowExpired24h = true
    }

    return response.status(200).send({
      data,
      lastReturnedAt: lastReturnedAt ? lastReturnedAt.toISO() : null,
      diffHours,
      windowExpired24h,
    })
  }

  public async sendMessage({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    // Captura template_id (vem do front) e demais campos do Customchat
    const { template_id } = request.only(['template_id'])

    const rawBody = await request.validate(CustomchatValidator)

    // Usa o template_id vindo do request (se existir)
    if (template_id !== undefined && template_id !== null && template_id !== '') {
      rawBody.template_id = Number(template_id)
    } else {
      rawBody.template_id = rawBody.template_id ?? null
    }
    //console.log("TEMPLATE_ID>>>>", rawBody)
    const createdAtRaw = rawBody.created_at

    if (!rawBody.id || !rawBody.cellphoneserialized) {
      return response.badRequest({
        error: 'Campos obrigatórios ausentes (id ou cellphoneserialized).',
      })
    }

    const formattedBody: any = {
      ...rawBody,
      cellphoneserialized: (await normalizePhoneKey(rawBody.cellphoneserialized)) || null,
      messagesent: false,
      chats_id: rawBody.id,
    }

    delete formattedBody.returned
    delete formattedBody.created_at
    delete formattedBody.id
    delete formattedBody.response
    delete formattedBody.template_id

    try {
      // 1) Agente padrão
      const agent = await Agent.query().where('default_chat', true).firstOrFail()

      // 2) Chat (paciente/campanha)
      const chat = await Chat.findOrFail(formattedBody.chats_id)

      // 3) Template (se houver)
      let template: Template | null = null
      let templateIdExternal: string | null = null

      if (rawBody.template_id) {
        template = await Template.findOrFail(rawBody.template_id)
        templateIdExternal = template.id_external

        if (!templateIdExternal) {
          throw new Error(`Template ${template.id} sem id_external configurado`)
        }
      }

      // 4) Montar parâmetros dinamicamente
      const templateParams: (string | number)[] =
        template && rawBody.template_id
          ? buildTemplateParams(template, chat, formattedBody)
          : []

      // 5) Verificar 23h desde último returned
      let shouldSendTemplate = false

      if (createdAtRaw && rawBody.template_id) {
        const query = Customchat.query()
          .where('chats_id', rawBody.id)
          .where('returned', true)
          .orderBy('created_at', 'desc')
        const customChat = await query.first()
        console.log(query.toQuery())
        const createdAt = customChat?.createdAt

        if (!createdAt) {
          shouldSendTemplate = true
          console.log('CREATED_AT NULO → shouldSendTemplate = true')
        } else if (createdAt && createdAt.isValid) {
          const diffHours = DateTime.now()
            .setZone('America/Sao_Paulo')
            .diff(createdAt, 'hours').hours

          console.log('DIFF HOURS:', diffHours)
          shouldSendTemplate = diffHours > 23
        } else {
          shouldSendTemplate = false
        }
      }

      console.log('ÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇ FORMATED:', shouldSendTemplate)
      // 6) Enviar TEMPLATE (se houver e regra permitir)
      if (rawBody.template_id && templateIdExternal && shouldSendTemplate) {
        const { status, messageId } = await SendMessageGupshup({
          agent,
          destination: formattedBody.cellphoneserialized,
          templateId: templateIdExternal,
          params: templateParams,
          useDefaultApiKey: true,
        })
        console.log('PASSO 1 - TEMPLATE ENVIADO....', { status, messageId })
      } else if (rawBody.template_id && !shouldSendTemplate) {
        console.log('Template NÃO enviado (menos de 23h desde created_at ou data inválida)')
      }

      // 7) Enviar texto normal (se tiver message)
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

      // 8) Mensagem para histórico
      const mensagemParaHistorico =
        formattedBody.message ||
        (templateIdExternal
          ? `TEMPLATE ${templateIdExternal} | params: ${templateParams.join(' | ')}`
          : '')

      formattedBody.message = mensagemParaHistorico

      // 9) Salvar no Customchat
      let payLoad: Customchat | undefined

      try {

        console.log("@@@@@@@@@@@@@@@@@@@@@@",formattedBody)

        payLoad = await Customchat.create({
          ...formattedBody,
          chatnumber: agent.gupshup_source,
          chatname: agent?.name,
          messagesent: true,
          //template_id: rawBody.template_id || null,
        })
        console.log('RETORNO:', agent.name)
      } catch (error) {
        console.log('Erro ao salvar Customchat:', error)
      }

      console.log("ATE AQUI.........")
      return

      // 10) Registrar na Talk
      await Talk.create({
        chat_id: formattedBody.chats_id,
        reg: formattedBody.reg,
        cellphone: formattedBody.cellphoneserialized,
        message: mensagemParaHistorico,
        chatnumber: agent.gupshup_source,
        type: 'to',
      })

      // 11) Atualizar last_response do Chat
      await Chat.query()
        .where('id', formattedBody.chats_id)
        .update({ last_response: 1 })

      // 12) Atualizar primeiro retorno de campanha
      if (chat.shippingcampaigns_id) {
        const shippingcampaign = await Shippingcampaign.find(chat.shippingcampaigns_id)

        if (shippingcampaign && !shippingcampaign.date_first_return) {
          shippingcampaign.date_first_return = DateTime.now().setZone('America/Sao_Paulo')
          await shippingcampaign.save()
        }
      }

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
