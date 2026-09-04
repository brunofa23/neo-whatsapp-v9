import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Chat from 'App/Models/Chat'
import Env from '@ioc:Adonis/Core/Env'
import Database from '@ioc:Adonis/Lucid/Database'
import { DateTime } from 'luxon'

export default class ChatsController {


  public async index({auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await Chat.query()
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }

  public async sentMessages({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const { initialdate, finaldate, interaction_id, reg, name, cellphone } = request.only([
      'initialdate',
      'finaldate',
      'interaction_id',
      'reg',
      'name',
      'cellphone',
    ])
    const initial = DateTime.fromISO(initialdate, { zone: 'America/Sao_Paulo' }).startOf('day')
    const final = DateTime.fromISO(finaldate, { zone: 'America/Sao_Paulo' }).endOf('day')

    if (!initial.isValid || !final.isValid) {
      return response.status(400).send({ message: 'Datas inválidas.' })
    }

    try {
      const query = Database.connection(Env.get('DB_CONNECTION_MAIN'))
        .from('chats')
        .select(
          'interaction_id',
          'reg',
          'name',
          'cellphone',
          'created_at',
          'ack',
          'returned'
        )
        .whereBetween('created_at', [
          initial.toSQL({ includeOffset: false }),
          final.toSQL({ includeOffset: false }),
        ])
        .orderBy('created_at', 'desc')

      if (interaction_id) {
        query.where('interaction_id', interaction_id)
      }

      if (reg) {
        query.where('reg', reg)
      }

      if (name) {
        query.where('name', 'like', `%${name}%`)
      }

      if (cellphone) {
        query.where('cellphone', 'like', `%${cellphone}%`)
      }

      const data = await query

      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }

  public async show({auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const data = await Chat.query().where('id', params.id).first()
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }


  public async update({auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Chat.fillable)
    try {
      const data = await Chat.query().where('id', params.id)
        .update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }


  //Fechamento de datas
  public async closed({auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const {start_date,end_date} = request.only(['start_date','end_date'])
    //console.log("passei no closed",start_date,end_date )
    //return
    //await auth.use('api').authenticate()
    try {
      const data = await Chat.query()
      .where('created_at','>=', start_date)
      .andWhere('created_at','<=', end_date)
        .update({closed:true})
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }



}
