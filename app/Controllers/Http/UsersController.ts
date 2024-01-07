import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'

export default class UsersController {

  public async index({ response }: HttpContextContract) {

    try {
      const data = await User.query()
      return response.status(200).send(data)
    } catch (error) {
      return error
    }

  }
  public async store({ request, response }: HttpContextContract) {
    const body = request.only(User.fillable)
    try {
      const data = await User.create(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }

  public async update({ params, request, response }: HttpContextContract) {

    console.log('user update:', params.id)
    const body = request.only(User.fillable)

    try {
      const data = await User.query().where('id', params.id)
        .update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }



}
