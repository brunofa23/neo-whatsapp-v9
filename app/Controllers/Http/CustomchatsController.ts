import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { DateTime } from 'luxon'
import WhatsAppClientManager from 'App/Services/whatsapp-web/WhatsAppClientManager'
import Agent from 'App/Models/Agent'
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
    const body = request.only(Customchat.fillable)
    body.messagesent = false
    body.chats_id = body.id
    delete body.returned
    delete body.created_at
    delete body.id
    delete body.response


    console.log("BODY>>", body)

    try {
      const agent = await Agent.query().where('default_chat', true).first()
      if (agent) {
        const client = WhatsAppClientManager.getClient(String(agent.id));
        await client.sendMessage(body.cellphoneserialized, body.message);

        const payLoad = await Customchat.create({ ...body, chatnumber: agent.number_phone })
        await Chat.query().where('id', body.chats_id).update({ last_response: 1 })
        // Obtém `shippingcampaigns_id` diretamente
        const chat = await Chat.find(body.chats_id)
        if (chat?.shippingcampaigns_id) {
          const shippingcampaign = await Shippingcampaign.find(chat.shippingcampaigns_id)
          if (shippingcampaign && !shippingcampaign.date_first_return) {
            shippingcampaign.date_first_return = DateTime.local().toFormat("yyyy-MM-dd HH:mm")
            await shippingcampaign.save()
          }
        }
        return response.status(201).send(payLoad)
      }
    } catch (error) {
      console.log("erro", error)
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
