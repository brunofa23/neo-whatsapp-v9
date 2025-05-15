import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import Hash from "@ioc:Adonis/Core/Hash"

export default class UsersController {

  public async index({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const { is_manager } = request.only(['is_manager'])

    try {
      const query = User.query()
      query.if(is_manager, query => query.where('is_manager', true))
        console.log(query.toQuery())
      const data = await query

      return response.status(200).send(data)
    } catch (error) {
      return error
    }

  }
  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(User.fillable)
    try {
      const data = await User.create(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(User.fillable)
    try {
      const data = await User.query().where('id', params.id)
        .update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }


  public async login({ auth, request, response }: HttpContextContract) {
    const body = request.only(User.fillable)
    const user = await User
      .query()
      .where('username', body.username)
      .first()

    if (!user) {
      throw new BadRequest("Invalid username", 401, "InvalidUsername")
    }

    // Verify password
    if (!(await Hash.verify(user.password, body.password))) {
      throw new BadRequest("Invalid password", 401, "InvalidPassword")
    }

    // Generate token
    const token = await auth.use('api').generate(user, {
      expiresIn: '7 days',
      name: user.username
    })
    return response.status(200).send({ token, user })

  }




}
