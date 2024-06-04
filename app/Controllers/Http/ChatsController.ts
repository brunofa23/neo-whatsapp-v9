import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Chat from 'App/Models/Chat'

export default class ChatsController {


  public async index({ response }: HttpContextContract) {
    console.log("passei aqui...")
    try {
      const data = await Chat.query()
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }

  public async show({ params, response }: HttpContextContract) {
    console.log("passei aqui...")
    try {
      const data = await Chat.query().where('id', params.id)
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }


  public async update({ params, request, response }: HttpContextContract) {
    console.log("passei aqui...")
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
