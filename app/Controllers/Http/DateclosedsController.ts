import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Dateclosed from 'App/Models/Dateclosed'
import Chat from 'App/Models/Chat'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'
export default class DateclosedsController {

  public async index({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const { month, year } = request.only(['month', 'year'])
    console.log("passei index 555", month, year)
    try {
      const data = await Dateclosed.query().where('month', month)
        .andWhere('year', year)
      //console.log("Agentes", agents)
      return response.status(200).send(data)
    } catch (error) {
      return error
    }

  }

  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Dateclosed.fillable)

    const startOfMonth = DateTime.local(parseInt(body.year), parseInt(body.month)).startOf("month").toFormat("yyyy-MM-dd");
    const endOfMonth = DateTime.local(parseInt(body.year), parseInt(body.month)).endOf("month").toFormat("yyyy-MM-dd");;
    console.log(">>", startOfMonth, endOfMonth)

    const trx = await Database.transaction()
    try {

      const verifyClosed = await Dateclosed.query()
      .where('month', body.month)
      .andWhere('year', body.year)
      .count('* as count')
      .first()
      console.log(verifyClosed?.$extras.count)
      if(verifyClosed?.$extras.count>=1)
        return response.status(409).send("Error conflict.")


      const data = await Dateclosed.create(body,{client:trx})
      const dataChat = await Chat.query()
        .where('created_at', '>=', startOfMonth)
        .andWhere('created_at', '<=', endOfMonth)
        .andWhere('interaction_id',2)
        .useTransaction(trx)
        .update({ closed: true })

       await trx.commit()
      return response.status(201).send(data)
    } catch (error) {
      await trx.rollback()
      return error
    }

  }




}
