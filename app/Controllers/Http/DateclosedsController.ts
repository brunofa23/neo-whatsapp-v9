import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Dateclosed from 'App/Models/Dateclosed'

export default class DateclosedsController {

  public async index({ auth,request, response }: HttpContextContract) {
      await auth.use('api').authenticate()
      const {month, year}=request.only(['month','year'])
      console.log("passei index 555", month, year)
      try {
        const data = await Dateclosed.query().where('month',month)
        .andWhere('year',year)
        //console.log("Agentes", agents)
        return response.status(200).send(data)
      } catch (error) {
        return error
      }

    }

    public async store({ auth, request, response }: HttpContextContract) {
      await auth.use('api').authenticate()
      const body = request.only(Dateclosed.fillable)
      console.log("dateclosed::::", body)
      try {
        const data = await Dateclosed.create(body)
        return response.status(201).send(data)
      } catch (error) {
        return error
      }

    }




}
