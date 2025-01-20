import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'
import Database from '@ioc:Adonis/Lucid/Database'
export default class CustomchatsController {

  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const query = Database.from('chats')
    .select('id','reg', 'cellphone', 'cellphoneserialized','message','response','invalidresponse','returned','chatname',
    Database.raw('0 messagesent'),'chatnumber',Database.raw('0  phonevalid'),Database.raw('0 `read`'),Database.raw('0 viewed'),
    Database.raw('0 ack'),
    Database.raw('0 path_media')
  )
    .where('id', params.id)
    .union(query=>{
      query.from('customchats')
     .select('id','reg', 'cellphone', 'cellphoneserialized','message','response','response','returned','chatname','messagesent','chatnumber','phonevalid', 'read', 'viewed','ack','path_media')
     .where('chats_id',params.id)
    })


    const data = await query
    return response.status(200).send(data)
  }

  public async sendMessage({auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Customchat.fillable)
    body.messagesent = false
    //console.log("Passei aqui 45888", body)
    try {
      const payLoad = await Customchat.create(body)
      return response.status(201).send(payLoad)
    } catch (error) {
      error
    }
  }


  public async viewedConfirmed({auth, params, response }: HttpContextContract) {
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
