import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Mainsubject from 'App/Models/Mainsubject'

export default class MainsubjectsController {

  public async index({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await Mainsubject.query().where('excluded',0)
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }



}
