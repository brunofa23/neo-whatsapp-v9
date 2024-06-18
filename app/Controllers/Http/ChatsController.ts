import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Chat from 'App/Models/Chat'

export default class ChatsController {


  public async index({auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await Chat.query()
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }

  public async show({auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await Chat.query().where('id', params.id)
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }


  public async update({auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Chat.fillable)
    try {
      const data = await Chat.query().where('id', params.id)
        .update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }



}
