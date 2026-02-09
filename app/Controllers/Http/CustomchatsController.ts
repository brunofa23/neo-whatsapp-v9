import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { DateTime } from 'luxon'
import WhatsAppClientManager from 'App/Services/whatsapp-web/WhatsAppClientManager'
import Agent from 'App/Models/Agent'
import Talk from 'App/Models/Talk'
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


  public async sendMessage({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    // Captura apenas os campos permitidos
    const rawBody = request.only(Customchat.fillable)

    // Validação básica de campos obrigatórios
    if (!rawBody.id || !rawBody.cellphoneserialized || !rawBody.message) {
      return response.badRequest({ error: 'Campos obrigatórios ausentes (id, message ou cellphoneserialized).' })
    }

    // Preparação do corpo formatado para salvar e enviar
    const formattedBody = {
      ...rawBody,
      messagesent: false,
      chats_id: rawBody.id,
    }

    // Remoção de campos não permitidos ou que serão tratados separadamente
    delete formattedBody.returned
    delete formattedBody.created_at
    delete formattedBody.id
    delete formattedBody.response

    //console.log("BODY>>", formattedBody)

    try {
      const agent = await Agent.query().where('default_chat', true).firstOrFail()
      const client = WhatsAppClientManager.getClient(String(agent.id))

      if (!client) {
        return response.status(500).send({ error: 'Cliente WhatsApp não encontrado para o agente.' })
      }

      // Envia a mensagem para o número de telefone
      await client.sendMessage(formattedBody.cellphoneserialized, formattedBody.message)

      // Salva o registro da mensagem
      const payLoad = await Customchat.create({
        ...formattedBody,
        chatnumber: agent.number_phone,
      })

      console.log(">>>>", client.info.wid._serialized)

      await Talk.create({
        chat_id: formattedBody.chats_id,
        reg: formattedBody.reg,
        cellphone: formattedBody.cellphoneserialized,
        message: formattedBody.message,
        chatnumber: client.info.wid._serialized,
        type: 'to',
      })

      // Atualiza a resposta no chat
      await Chat.query().where('id', formattedBody.chats_id).update({ last_response: 1 })

      // Verifica e atualiza o primeiro retorno da campanha, se aplicável
      const chat = await Chat.find(formattedBody.chats_id)
      if (chat?.shippingcampaigns_id) {
        const shippingcampaign = await Shippingcampaign.find(chat.shippingcampaigns_id)
        if (shippingcampaign && !shippingcampaign.date_first_return) {
          shippingcampaign.date_first_return = DateTime.now().setZone('America/Sao_Paulo')//.toFormat('yyyy-MM-dd HH:mm:ss')
          await shippingcampaign.save()
        }
      }

      return response.status(201).send(payLoad)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      return response.status(500).send({ error: `Falha ao enviar mensagem. Verifique o servidor.ERRO:${error}` })
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
