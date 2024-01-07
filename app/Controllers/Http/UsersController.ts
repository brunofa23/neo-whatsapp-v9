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


  public async login({ auth, request, response }: HttpContextContract) {

    const username = request.input('username')
    const shortname = request.input('shortname')
    const password = request.input('password')

    const user = await User
      .query()
      .preload('company')
      .where('username', username)
      .whereHas('company', builder => {
        builder.where('shortname', shortname)
      })
      .first()

    if (!user) {
      const errorValidation = await new validations('user_error_205')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // Verify password
    if (!(await Hash.verify(user.password, password))) {
      let errorValidation = await new validations('user_error_206')
      throw new BadRequest(errorValidation.messages, errorValidation.status, errorValidation.code)
    }

    // Generate token
    const token = await auth.use('api').generate(user, {
      expiresIn: '7 days',
      name: 'For the CLI app'

    })

    logtail.debug("debug", { token, user })
    logtail.flush()

    //return { token, user }
    return response.status(200).send({ token, user })

  }




}
