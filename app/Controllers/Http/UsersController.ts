import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import Hash from "@ioc:Adonis/Core/Hash"

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


  public async login({ auth, request, response }: HttpContextContract) {

    console.log("acessei o login...", auth)
    const body = request.only(User.fillable)

    const user = await User
      .query()
      .where('username', body.username)
      .first()

    if (!user) {
      //const errorValidation = await new validations('user_error_205')
      throw new BadRequest("error", 401, "Invalid User")
    }

    // Verify password
    if (!(await Hash.verify(user.password, body.password))) {
      //let errorValidation = await new validations('user_error_206')
      throw new BadRequest("error", 401, "Invalid Password")
    }

    // Generate token
    const token = await auth.use('api').generate(user, {
      expiresIn: '7 days',
      name: user.username

    })

    //return { token, user }
    return response.status(200).send({ token, user })

  }




}
