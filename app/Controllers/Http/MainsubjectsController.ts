import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Mainsubject from 'App/Models/Mainsubject'

export default class MainsubjectsController {

  public async index({ auth,request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    console.log("ENTREI AQUI>>>>>",auth)
    try {
      const data = await Mainsubject.query().where('excluded', 0)
      console.log("SAI AQUI>>>>>")
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }



}
