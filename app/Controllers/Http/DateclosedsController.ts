import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Dateclosed from 'App/Models/Dateclosed'
import Chat from 'App/Models/Chat'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'
import BadRequest from 'App/Exceptions/BadRequestException'
export default class DateclosedsController {

  public async index({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const { month, year } = request.only(['month', 'year'])
    try {
      const query = Dateclosed.query()
      if (month && year) {
        query.where('month', month)
        query.andWhere('year', year)
      }
      // if (limit) {
      //query.limit(10)
      query.orderBy('year', 'desc')
      query.orderBy('month', 'desc')
      // }
      const data = await query
      return response.status(200).send(data)
    } catch (error) {
      return error
    }

  }

  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Dateclosed.fillable)
    if (body.month == null || body.year == null) {
      return response.status(401).send('values nulls')
    }

    const startOfMonth = DateTime.local(parseInt(body.year), parseInt(body.month)).startOf("month").toFormat("yyyy-MM-dd");
    const endOfMonth = DateTime.local(parseInt(body.year), parseInt(body.month)).endOf("month").toFormat("yyyy-MM-dd");;

    const trx = await Database.transaction()
    try {
      const data = await Dateclosed.create(body, { client: trx })
      await Chat.query()
        .where('created_at', '>=', startOfMonth)
        .andWhere('created_at', '<=', endOfMonth)
        .andWhere('interaction_id', 2)
        .useTransaction(trx)
        .update({ closed: true })

      await trx.commit()
      return response.status(201).send(data)
    } catch (error) {
      await trx.rollback()
      return response.status(409).send(error)
    }
  }


  public async destroy({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await Dateclosed.findOrFail(params.id)
      await data.delete()
      return response.status(204).send("Excluído com sucesso!!")
    } catch (error) {
      throw new BadRequest('Bad Request', 401, error)
    }
  }



}
