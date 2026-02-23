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

export default class CustomchatsController {

  public async show({ auth, params, response }: HttpContextContract) {

    await auth.use('api').authenticate()
    const query = Database.from('chats')
      .select('id', 'reg', 'cellphone', 'cellphoneserialized', 'message', 'response', 'invalidresponse', 'returned', 'chatname',
        Database.raw('0 messagesent'), 'chatnumber', Database.raw('0  phonevalid'), Database.raw('0 `read`'), Database.raw('0 viewed'),
        Database.raw('0 ack'),
        Database.raw('0 path_media'),
        Database.raw('created_at')
      )
      .where('id', params.id)
      .union(query => {
        query.from('customchats')
          .select('id', 'reg', 'cellphone', 'cellphoneserialized', 'message', 'response', 'response', 'returned', 'chatname', 'messagesent', 'chatnumber', 'phonevalid', 'read', 'viewed', 'ack', 'path_media', 'created_at')
          .where('chats_id', params.id)
      })
    //console.log(query.toQuery())
    const data = await query
    return response.status(200).send(data)
  }


  // public async sendMessage({ auth, request, response }: HttpContextContract) {
  //   await auth.use('api').authenticate()

  //   // Captura apenas os campos permitidos
  //   const rawBody = request.only(Customchat.fillable)

  //   // Validação básica de campos obrigatórios
  //   if (!rawBody.id || !rawBody.cellphoneserialized || !rawBody.message) {
  //     return response.badRequest({ error: 'Campos obrigatórios ausentes (id, message ou cellphoneserialized).' })
  //   }

  //   // Preparação do corpo formatado para salvar e enviar
  //   const formattedBody = {
  //     ...rawBody,
  //     messagesent: false,
  //     chats_id: rawBody.id,
  //   }

  //   // Remoção de campos não permitidos ou que serão tratados separadamente
  //   delete formattedBody.returned
  //   delete formattedBody.created_at
  //   delete formattedBody.id
  //   delete formattedBody.response

  //   //console.log("BODY>>", formattedBody)

  //   try {
  //     const agent = await Agent.query().where('default_chat', true).firstOrFail()
  //     const client = WhatsAppClientManager.getClient(String(agent.id))

  //     if (!client) {
  //       return response.status(500).send({ error: 'Cliente WhatsApp não encontrado para o agente.' })
  //     }

  //     // Envia a mensagem para o número de telefone
  //     await client.sendMessage(formattedBody.cellphoneserialized, formattedBody.message)

  //     // Salva o registro da mensagem
  //     const payLoad = await Customchat.create({
  //       ...formattedBody,
  //       chatnumber: agent.number_phone,
  //     })

  //     console.log(">>>>", client.info.wid._serialized)

  //     await Talk.create({
  //       chat_id: formattedBody.chats_id,
  //       reg: formattedBody.reg,
  //       cellphone: formattedBody.cellphoneserialized,
  //       message: formattedBody.message,
  //       chatnumber: client.info.wid._serialized,
  //       type: 'to',
  //     })

  //     // Atualiza a resposta no chat
  //     await Chat.query().where('id', formattedBody.chats_id).update({ last_response: 1 })

  //     // Verifica e atualiza o primeiro retorno da campanha, se aplicável
  //     const chat = await Chat.find(formattedBody.chats_id)
  //     if (chat?.shippingcampaigns_id) {
  //       const shippingcampaign = await Shippingcampaign.find(chat.shippingcampaigns_id)
  //       if (shippingcampaign && !shippingcampaign.date_first_return) {
  //         shippingcampaign.date_first_return = DateTime.now().setZone('America/Sao_Paulo')//.toFormat('yyyy-MM-dd HH:mm:ss')
  //         await shippingcampaign.save()
  //       }
  //     }

  //     return response.status(201).send(payLoad)
  //   } catch (error) {
  //     console.error('Erro ao enviar mensagem:', error)
  //     return response.status(500).send({ error: `Falha ao enviar mensagem. Verifique o servidor.ERRO:${error}` })
  //   }
  // }


  public async sendMessage({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    console.log("PASSEI AQUI")
    // Captura apenas os campos permitidos
    const {template_id} = request.only(['template_id'])
    const rawBody = request.only(Customchat.fillable)
    rawBody.template_id = template_id

    // const rawBody = {
    //   id: 4856,
    //   template_id: 1,
    //   cellphoneserialized: '5531985228619'
    // }

    /**
     * Esperado no payload (além do que você já tem):
     * - rawBody.template_id  -> id interno da tabela templates
     *
     * Exemplo de payload vindo do front:
     * {
     *   id: 123, // id do chat (chats_id)
     *   cellphoneserialized: "5531999999999",
     *   template_id: 5,
     *   // opcional: message (pré-visualização / texto que você quer gravar no histórico)
     * }
     */

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
      messagesent: false,
      chats_id: rawBody.id,
    }

    // Remoção de campos não permitidos ou que serão tratados separadamente
    delete formattedBody.returned
    delete formattedBody.created_at
    delete formattedBody.id
    delete formattedBody.response

    try {
      // === 1) Buscar agente padrão (como você já fazia) ===
      const agent = await Agent.query().where('default_chat', true).firstOrFail()

      // === 2) Buscar o chat para pegar info do paciente / campanha ===
      const chat = await Chat.findOrFail(formattedBody.chats_id)

      // 🔴 Ajuste aqui conforme o seu modelo de Chat/paciente:
      // Tente algo como chat.patient_name, chat.name, chat.person_name, etc.
      const patientName =
        (chat as any).patient_name ||
        (chat as any).name ||
        (chat as any).person_name ||
        ''

      // === 3) Buscar o template na sua tabela ===
      const template = await Template.findOrFail(rawBody.template_id)
      // 🔴 Ajuste aqui conforme o campo que guarda o id do template no Gupshup
      const templateId = template.id_external//(template as any).gupshup_template_id || template.id
      console.log("template:", template, "templateID:", templateId)

      // === 4) Montar os parâmetros do template ===
      // Aqui você coloca na ordem dos placeholders configurados no Gupshup/meta.
      // Exemplo: {{1}} = nome do paciente, {{2}} = nome da clínica, etc.
      const templateParams: (string | number)[] = [
        patientName,
        // adicione outros params aqui conforme seu template:
        // chat.doctor_name,
        // chat.schedule_date,
        // ...
      ]

      // === 5) Enviar via Gupshup (template) ===
      const { status, messageId } = await SendMessageGupshup({
        agent,
        destination: formattedBody.cellphoneserialized,
        templateId,
        params: templateParams,
        useDefaultApiKey:true
      })

      // Para salvar no histórico, se o campo "message" for NOT NULL,
      // você pode montar uma descrição amigável:
      const mensagemParaHistorico =
        formattedBody.message ||
        `TEMPLATE ${templateId} | params: ${templateParams.join(' | ')}`

      formattedBody.message = mensagemParaHistorico

      // === 6) Salvar registro da mensagem no Customchat ===
      const payLoad = await Customchat.create({
        ...formattedBody,
        chatnumber: agent.gupshup_source, // ou agent.number_phone, ajuste conforme seu modelo
        messagesent: true,
        // se tiver colunas específicas para o retorno do Gupshup:
        // returned: JSON.stringify({ status, messageId }),
        // gupshup_message_id: messageId,
        // gupshup_status: status,
      })

      // === 7) Registrar na Talk (histórico de conversas) ===
      await Talk.create({
        chat_id: formattedBody.chats_id,
        reg: formattedBody.reg,
        cellphone: formattedBody.cellphoneserialized,
        message: mensagemParaHistorico,
        chatnumber: agent.gupshup_source, // aqui também pode usar o source do WABA
        type: 'to',
      })

      // === 8) Atualizar a resposta no chat ===
      await Chat.query()
        .where('id', formattedBody.chats_id)
        .update({ last_response: 1 })

      // === 9) Atualizar primeiro retorno de campanha, se aplicável ===
      if (chat.shippingcampaigns_id) {
        const shippingcampaign = await Shippingcampaign.find(
          chat.shippingcampaigns_id
        )

        if (shippingcampaign && !shippingcampaign.date_first_return) {
          shippingcampaign.date_first_return = DateTime.now().setZone(
            'America/Sao_Paulo'
          )
          await shippingcampaign.save()
        }
      }

      return response.status(201).send(payLoad)
    } catch (error) {
      console.log('ERRO GUPSHUP DATA >>>', error.response?.data)
      // console.error('Erro ao enviar mensagem Gupshup:', error)
      // return response
      //   .status(500)
      //   .send({ error: `Falha ao enviar mensagem via Gupshup. ERRO: ${error}` })
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
