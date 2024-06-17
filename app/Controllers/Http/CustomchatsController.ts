import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'
import Database from '@ioc:Adonis/Lucid/Database'
export default class CustomchatsController {

  public async show({ auth, params, response }: HttpContextContract) {
    //const authenticate = await auth.use('api').authenticate()
    //const data = await Customchat.query().where('chats_id', params.id)
    // const rawQuery = `select 0,id,reg,cellphone,cellphoneserialized,message,response,returned,chatname,0,chatnumber,0,0,0,0 from chats where id=43406
    // union
    // select id,chats_id,reg,cellphone,cellphoneserialized,message,response,returned,chatname,messagesent,chatnumber,phonevalid, \`read\`, viewed,ack from customchats where chats_id=43406`

    const data = await Database.from('chats')
    .select('id','reg', 'cellphone', 'cellphoneserialized','message',
    'response','returned','chatname',
    Database.raw('0 messagesent'),'chatnumber',Database.raw('0  phonevalid'),Database.raw('0 `read`'),Database.raw('0 viewed'),
    Database.raw('0 ack')).where('id', params.id)
    .union(query=>{
      query.from('customchats')
     .select('id','reg', 'cellphone', 'cellphoneserialized','message','response','returned','chatname','messagesent','chatnumber','phonevalid', 'read', 'viewed','ack')
     .where('chats_id',params.id)
    })

    return response.status(200).send(data)
  }

  public async sendMessage({ request, response }: HttpContextContract) {
    console.log("passei no sendMessage.........8888888")
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


  public async viewedConfirm({ params, response }: HttpContextContract) {
    try {
      console.log("passei no viewed.........",params)

      const data = await Customchat.query()
        .where('chats_id', params.chats_id)
        .update({ viewed: true })

      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }




}
