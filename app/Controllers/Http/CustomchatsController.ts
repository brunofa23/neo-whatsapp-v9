import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Customchat from 'App/Models/Customchat'

export default class CustomchatsController {

  public async sendMessage({ params, request, response }: HttpContextContract) {

    const body = request.only(Customchat.fillable)
    console.log("body", body)
    try {
      const payLoad = await Customchat.create(body)
      return response.status(201).send(payLoad)
    } catch (error) {
      error
    }
  }



}
