import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { executeWhatsapp } from '../../Services/whatsapp-web/whatsapp'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'

import { DateFormat, InvalidResponse } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'

export default class ShippingcampaignsController {

  static get connection() {
    return 'mssql2';
  }
  public async index({ response, request }) {
    try {
      const shippingCampaign = await Shippingcampaign.all()
      return response.status(200).send(shippingCampaign)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }
  }

  public async store({ response, request }) {
    try {
      const shippingCampaign = await Shippingcampaign
        .query()
      return response.status(200).send(shippingCampaign)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }

  }


  public async messagesSent() {
    try {
      const maxLimitSendMessage =
        await Shippingcampaign.query()
          .where('messagesent', '=', '1')
      return maxLimitSendMessage
    } catch (error) {
      return error

    }
  }


  public async maxLimitSendMessage() {
    const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
    const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
    const chatName = process.env.CHAT_NAME
    const countMessage = await Chat.query()
      .countDistinct('shippingcampaigns_id as tot')
      .where('chatname', String(chatName))
      .whereBetween('created_at', [dateStart, dateEnd]).first()
    if (!countMessage || countMessage == undefined || countMessage == null)
      return 0
    return parseInt(countMessage.$extras.tot)
  }

  public async resetWhatsapp() {
    await executeWhatsapp
  }


  public async chat({ response, request }) {

    //return "tester"
    const id = 567508
    const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}` //`update agm set agm_confirm_stat = 'C' where agm_id=:id`
    //const query = "select top 10 * from agm order by agm_hini desc"
    try {
      console.log("EXECUTANDO UPDATE NO SMART...", query)
      //const result = await Database.connection('mssql').rawQuery(query)
      await Database.connection('mssql').rawQuery(query).then((result) => {
        return `executado com sucesso:: ${result}`
      }).catch((error) => {
        return `Error: ${error}`
      })

      //console.log("QUERY>>>", result)
      //return result

    } catch (error) {
      return error
    }


  }


  public async dayPosition(period: String = "") {


    console.log("ENTREI NO DAYPOSITION..")
    const startDate = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
    const endDate = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())

    const totalDiario = await Shippingcampaign.query()
      .whereBetween('created_at', [startDate, endDate])
      .count('* as totalDiario').first()

    const telefonesValidos = await Shippingcampaign.query()
      .where('phonevalid', 1)
      .whereBetween('created_at', [startDate, endDate])
      .count('* as telefonesValidos').first();

    const mensagensEnviadas = await Shippingcampaign.query()
      .where('messagesent', 1)
      .whereBetween('created_at', [startDate, endDate])
      .count('* as mensagensEnviadas').first()

    const mensagensRetornadas = await Chat.query()
      .where('returned', 1)
      .whereBetween('created_at', [startDate, endDate])
      .count('* as mensagensRetornadas').first()

    const confirmacoes = await Chat.query()
      .where('absoluteresp', 1)
      .whereBetween('created_at', [startDate, endDate])
      .count('* as confirmacoes').first()

    const reagendamentos = await Chat.query()
      .where('absoluteresp', 2)
      .whereBetween('created_at', [startDate, endDate])
      .count('* as reagendamentos').first()


    const result = {
      totalDiario: totalDiario.$extras.totalDiario,
      telefonesValidos: telefonesValidos.$extras.telefonesValidos,
      mensagensEnviadas: mensagensEnviadas.$extras.mensagensEnviadas,
      mensagensRetornadas: mensagensRetornadas.$extras.mensagensRetornadas,
      confirmacoes: confirmacoes.$extras.confirmacoes,
      reagendamentos: reagendamentos.$extras.reagendamentos
    }
    return result

  }



  public async datePosition({ request, response }: HttpContextContract) {

    console.log("PASSEI DATEPOSITION")

    const { initialdate, finaldate } = request.only(['initialdate', 'finaldate'])

    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }

    try {
      const result = await Database.connection('mssql2').query()
        .select(Database.raw('CONVERT(date, shippingcampaigns.created_at) as dataPeriodo'))
        .select(Database.raw('COUNT(*) as totalDiario'))
        .select(Database.raw('SUM(CASE WHEN phonevalid = 1 THEN 1 ELSE 0 END) as telefonesValidos'))
        .select(Database.raw('SUM(CASE WHEN messagesent = 1 THEN 1 ELSE 0 END) as mensagensEnviadas'))
        .select(Database.raw('SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) AS mensagensRetornadas'))
        .select(Database.raw('SUM(CASE WHEN absoluteresp = 1 THEN 1 ELSE 0 END) AS confirmacoes'))
        .select(Database.raw('SUM(CASE WHEN absoluteresp = 2 THEN 1 ELSE 0 END) AS reagendamentos'))
        .from('shippingcampaigns')
        .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])
        .groupByRaw('CONVERT(date, shippingcampaigns.created_at)')
        .orderByRaw(Database.raw('CONVERT(date, shippingcampaigns.created_at)'))

      return response.status(201).send(result)
    } catch (error) {
      throw new Error(error)
    }


  }


  public async datePositionSynthetic({ request, response }: HttpContextContract) {

    console.log("PASSEI DATEPOSITION")

    const { initialdate, finaldate } = request.only(['initialdate', 'finaldate'])
    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }
    try {
      const result = await Database.connection('mssql2').query()
        .select(Database.raw('COUNT(*) as totalDiario'))
        .select(Database.raw('SUM(CASE WHEN phonevalid = 1 THEN 1 ELSE 0 END) as telefonesValidos'))
        .select(Database.raw('SUM(CASE WHEN messagesent = 1 THEN 1 ELSE 0 END) as mensagensEnviadas'))
        .select(Database.raw('SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) AS mensagensRetornadas'))
        .select(Database.raw('SUM(CASE WHEN absoluteresp = 1 THEN 1 ELSE 0 END) AS confirmacoes'))
        .select(Database.raw('SUM(CASE WHEN absoluteresp = 2 THEN 1 ELSE 0 END) AS reagendamentos'))
        .from('shippingcampaigns')
        .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])


      return response.status(201).send(result)
    } catch (error) {
      throw new Error(error)
    }


  }


  public async listShippingCampaigns({ request, response }: HttpContextContract) {


    const { initialdate, finaldate, phonevalid, invalidresponse, absoluteresp } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp'])
    console.log("phonevalid", phonevalid)
    let query = "1=1"
    if (phonevalid && phonevalid !== undefined) {
      query += ` and phonevalid=${phonevalid == 1 ? 1 : 0}`
    }
    if (invalidresponse) {
      query += ` and invalidresponse not in ('1', '2', 'Sim', 'Não')`
    }
    if (absoluteresp) {
      query += ` and absoluteresp=${absoluteresp} `
    }

    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }
    try {
      const result = await Database.connection('mssql2').query()
        .from('shippingcampaigns')
        .select(
          'shippingcampaigns.interaction_id',
          'shippingcampaigns.reg',
          'shippingcampaigns.name',
          'shippingcampaigns.cellphone',
          'otherfields',
          'phonevalid',
          'messagesent',
          'chats.created_at',
          'response',
          'returned',
          'invalidresponse',
          'chatname',
          'absoluteresp'
        )
        .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])
        .where('shippingcampaigns.interaction_id', 1)
        .whereRaw(query)

      //console.log("query", result)
      return response.status(201).send(result)
    } catch (error) {
      throw new Error(error)
    }

  }



  public async serviceEvaluationDashboard({ request, response }: HttpContextContract) {

    console.log("SERVICE EVALUATION_______________")
    const { initialdate, finaldate, phonevalid, invalidresponse, absoluteresp } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp'])
    console.log("phonevalid", phonevalid)
    let query = "1=1"
    if (phonevalid && phonevalid !== undefined) {
      query += ` and phonevalid=${phonevalid == 1 ? 1 : 0}`
    }
    // if (invalidresponse) {
    //   query += ` and invalidresponse not in ('1', '2', 'Sim', 'Não')`
    // }
    if (absoluteresp) {
      query += ` and absoluteresp=${absoluteresp} `
    }

    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }
    try {
      const result = await Database.connection('mssql2').query()
        .from('shippingcampaigns')
        .select(
          'shippingcampaigns.interaction_id',
          'shippingcampaigns.reg',
          'shippingcampaigns.name',
          'shippingcampaigns.cellphone',
          'otherfields',
          'phonevalid',
          'messagesent',
          'chats.created_at',
          'response',
          'returned',
          'invalidresponse',
          'chatname',
          'absoluteresp'
        )
        .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])
        .where('shippingcampaigns.interaction_id', 2)
        .whereRaw(query)


      return response.status(201).send(result)
    } catch (error) {
      throw new Error(error)
    }

  }





}
