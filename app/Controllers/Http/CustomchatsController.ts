import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'

export default class CustomchatsController {


  public async show({ auth, params, response }: HttpContextContract) {
    //const authenticate = await auth.use('api').authenticate()
    const data = await Customchat.query().where('chats_id', params.id)
    return response.status(200).send(data)
  }

  public async sendMessage({ params, request, response }: HttpContextContract) {
    const body = request.only(Customchat.fillable)
    body.messagesent = false
    //console.log("body", body)
    try {
      const payLoad = await Customchat.create(body)
      return response.status(201).send(payLoad)
    } catch (error) {
      error
    }
  }





}
