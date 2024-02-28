import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'

export default class CustomchatsController {

  public async show({ auth, params, response }: HttpContextContract) {
    //const authenticate = await auth.use('api').authenticate()
    const data = await Customchat.query().where('chats_id', params.id)
    return response.status(200).send(data)
  }

  public async sendMessage({ request, response }: HttpContextContract) {

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
      const data = await Customchat.query()
        .where('chats_id', params.chats_id)
        .update({ viewed: true })

      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }




}
