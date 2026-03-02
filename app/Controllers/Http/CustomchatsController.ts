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
        Database.raw('created_at')
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
    return response.status(200).send(data)
  }

  public async sendMessage({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    console.log('PASSEI AQUI')
    // Captura apenas template_id e campos permitidos do Customchat
    const { template_id } = request.only(['template_id'])

    const rawBody = await request.validate(CustomchatValidator)
    // Usa o template_id vindo do request (se quiser fixo em 1, troque de volta)
    rawBody.template_id = 1//template_id
    // Guarda o created_at original ANTES de mexer no formattedBody
    const createdAtRaw = rawBody.created_at

    if (!rawBody.id || !rawBody.cellphoneserialized) {
      return response.badRequest({
        error: 'Campos obrigatórios ausentes (id ou cellphoneserialized).',
      })
    }

    if (!rawBody.template_id) {
      return response.badRequest({
        error: 'template_id é obrigatório para envio via Gupshup.',
      })
    }
    // Preparação base do corpo para salvar
    const formattedBody: any = {
      ...rawBody,
      cellphoneserialized: (await normalizePhoneKey(rawBody.cellphoneserialized)) || null,
      messagesent: false,
      chats_id: rawBody.id,
    }
    //console.log('#####', rawBody)
    // Remoção de campos não permitidos ou que serão tratados separadamente
    delete formattedBody.returned
    delete formattedBody.created_at
    delete formattedBody.id
    delete formattedBody.response
    delete formattedBody.template_id



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

      // === 3) Buscar o template na sua tabela ===
      const template = await Template.findOrFail(rawBody.template_id)

      // Usa SEMPRE o id_external (id do template na Gupshup)
      const templateId = template.id_external

      if (!templateId) {
        throw new Error(`Template ${template.id} sem id_external configurado`)
      }

      // === 4) Montar os parâmetros do template ===
      const templateParams: (string | number)[] = [
        patientName,
        // ex.: chat.doctor_name,
        // ex.: chat.schedule_date,
      ]

      // === 5) Verificar se já se passaram mais de 23 horas desde o created_at ===
      let shouldSendTemplate = false

      if (createdAtRaw) {
        const customChat = await Customchat.query()
          .where('chats_id', rawBody.id)
          .orderBy('created_at', 'desc')
          .first()

        const createdAt = customChat?.createdAt // DateTime | undefined
        console.log('CREATED_AT:', createdAt ? createdAt.toISO() : null)
        if (!createdAt) {
          shouldSendTemplate = true
          console.log("CREATED ATTTTT NULOOOOO", shouldSendTemplate)
        } else
          if (createdAt && createdAt.isValid) {
            const diffHours = DateTime.now()
              .setZone('America/Sao_Paulo')
              .diff(createdAt, 'hours').hours
            console.log('DIFF HOURS:', diffHours)
            // Só envia template se o registro foi criado há mais de 23h
            shouldSendTemplate = diffHours > 23
          } else {
            // Se não tiver created_at válido, você define a regra.
            // Aqui vou deixar como false (não envia template).
            shouldSendTemplate = false
          }

      }

      // Envia o TEMPLATE via Gupshup somente se passou de 23 horas
      if (shouldSendTemplate) {
        const { status, messageId } = await SendMessageGupshup({
          agent,
          destination: formattedBody.cellphoneserialized,
          templateId,
          params: templateParams,
          useDefaultApiKey: true,
        })

        console.log('PASSO 1 - TEMPLATE ENVIADO....', { status, messageId })
      } else {
        console.log('Template NÃO enviado (menos de 23h desde created_at ou data inválida)')
      }

      // ✅ Envia texto normal via endpoint /msg (sempre)
      const sendText = await SendTextGupshup({
        source: agent.gupshup_source,
        destination: formattedBody.cellphoneserialized,
        text: formattedBody.message,
        useDefaultApiKey: true,
      })
      console.log('PASSO 2 - TEM QUE PASSAR POR AQUI....', sendText)
      console.log('FFFFFFFFFFFFFFFFFFFFFFFF', shouldSendTemplate)
      // Para salvar no histórico
      const mensagemParaHistorico =
        formattedBody.message ||
        `TEMPLATE ${templateId} | params: ${templateParams.join(' | ')}`

      formattedBody.message = mensagemParaHistorico

      // === 6) Salvar registro da mensagem no Customchat ===
      let payLoad: Customchat | undefined

      try {
        payLoad = await Customchat.create({
          ...formattedBody,
          chatnumber: agent.gupshup_source,
          chatname: agent?.name,
          messagesent: true,
        })
        console.log('RETORNO:', agent.name)
      } catch (error) {
        console.log('Erro ao salvar Customchat:', error)
      }

      // === 7) Registrar na Talk (histórico de conversas) ===
      await Talk.create({
        chat_id: formattedBody.chats_id,
        reg: formattedBody.reg,
        cellphone: formattedBody.cellphoneserialized,
        message: mensagemParaHistorico,
        chatnumber: agent.gupshup_source,
        type: 'to',
      })

      // === 8) Atualizar a resposta no chat ===
      await Chat.query()
        .where('id', formattedBody.chats_id)
        .update({ last_response: 1 })

      // === 9) Atualizar primeiro retorno de campanha, se aplicável ===
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
