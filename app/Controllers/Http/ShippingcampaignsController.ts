import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'
import Env from '@ioc:Adonis/Core/Env'
import { DateFormat } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'
import BadRequest from 'App/Exceptions/BadRequestException'
import axios from 'axios'
import Agent from 'App/Models/Agent';
import { schema } from '@ioc:Adonis/Core/Validator'
import { getHeaders } from 'App/util/header'
import PersistShippingcampaign from 'App/Services/whatsapp-web/PersistShippingcampaign new'


async function validateParams(request: HttpContextContract['request']) {
  const payload = await request.validate({
    schema: schema.create({
      date: schema.string(), // ou schema.date()
      interaction_id: schema.number(),
      unit_cod: schema.number.nullableAndOptional(),
    }),
  })
  return payload
}


export default class ShippingcampaignsController {

  static get connection() {
    return 'mysql';
  }


  public async index({ auth, request, response }) {
    await auth.use('api').authenticate()
    const { created_atStart, created_atEnd, summary } = request.only(['created_atStart', 'created_atEnd', 'summary'])
    try {

      if (summary) {
        const query = Database.rawQuery(`
          SELECT
            (SELECT COUNT(*)
             FROM shippingcampaigns
             WHERE created_at >= ? AND created_at <= ? AND phonevalid IS NULL) AS tot,
            (SELECT COUNT(*)
             FROM shippingcampaigns
             WHERE created_at >= ? AND created_at <= ? AND messagesent = 1) AS totSend
        `, [created_atStart, created_atEnd, created_atStart, created_atEnd]);
        const result = await query
        return response.status(200).send(result[0][0])
      } else {
        const query = Shippingcampaign.query()
        if (created_atStart && created_atEnd) {
          query.where('created_at', '>=', created_atStart)
          query.where('created_at', '<=', created_atEnd)
        }
        const result = await query
        return response.status(200).send(result)
      }

    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Shippingcampaign.fillable)
    response.send(body)
    const data = await Shippingcampaign.create(body)
    return response.status(201).send(data)

  }


  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const payLoad = await Shippingcampaign.find(params.id)
      return response.status(200).send(payLoad)
    } catch (error) {
      return error
      //throw new BadRequest('Erro', 401, 'erro')
    }
  }


  public async update({ auth, request, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Shippingcampaign.fillable)
    body.id = params.id
    delete body.created_at
    if (body.date_first_return)
      body.date_first_return = DateTime.fromFormat(body.date_first_return, "dd/MM/yyyy HH:mm").toFormat("yyyy-MM-dd HH:mm")
    try {
      const data = await Shippingcampaign.query().where('id', params.id).update(body)
      return response.status(201).send(data)
    } catch (error) {
      //return error
      throw new BadRequest('Bad Request', 401, error)
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


  public async resend({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const justify_excluded = request.input('justify_excluded')

    try {
      await Shippingcampaign.query().where('id', params.id).update({ 'excluded': true, 'justify_excluded': justify_excluded })
      const message = await Shippingcampaign.find(params.id)
      if (message) {
        const newData = await Shippingcampaign.create({
          attendant: message?.attendant,
          cellphone: message?.cellphone,
          cellphoneserialized: message.cellphoneserialized,
          doctor: message?.doctor,
          idexternal: message?.idexternal,
          interaction_id: message?.interaction_id,
          interaction_seq: message?.interaction_seq,
          message: message?.message,
          messagesent: false,
          name: message?.name,
          otherfields: message?.otherfields,
          prioritysend: true,
          reg: message?.reg,
          dateservice: message?.dateservice,
          unit: message?.unit
        })
        return response.status(201).send(newData)
      }

    } catch (error) {
      throw new BadRequest('Bad Request', 401, error)
    }


  }


  public async doctorList({ response }) {
    try {
      const shippingCampaign = await Shippingcampaign.query()
        .distinct('doctor')
        .orderBy('doctor', 'asc')
      return response.status(200).send(shippingCampaign)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }
  }

  public async unitList({ response }) {
    try {
      const excludedUnitCods = ['undefined'].filter(Boolean);
      const shippingCampaign = await Shippingcampaign.query()
        .distinct('unit', 'unit_cod')
        .whereNotNull('unit_cod')
        .if(excludedUnitCods.length > 0, (query) => {
          query.whereNotIn('unit_cod', excludedUnitCods);
        })
        .orderBy('unit', 'asc')
      return response.status(200).send(shippingCampaign)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }
  }

  public async attendantList({ response }) {
    try {
      const shippingCampaign = await Shippingcampaign.query()
        .distinct('attendant')
        .orderBy('attendant', 'asc')
      return response.status(200).send(shippingCampaign)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }
  }

  public async maxLimitSendMessage(agent: Agent) {
    const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
    const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
    const chatName = agent.name
    const countMessage = await Chat.query()
      .countDistinct('shippingcampaigns_id as tot')
      .where('chatname', chatName)
      .whereBetween('created_at', [dateStart, dateEnd]).first()
    if (!countMessage || countMessage == undefined || countMessage == null)
      return 0
    return parseInt(countMessage.$extras.tot)
  }


  public async chat() {
    const id = 567508
    const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}` //`update agm set agm_confirm_stat = 'C' where agm_id=:id`
    //const query = "select top 10 * from agm order by agm_hini desc"
    try {
      //const result = await Database.connection('mssql').rawQuery(query)
      await Database.connection('mssql').rawQuery(query).then((result) => {
        return `executado com sucesso:: ${result}`
      }).catch((error) => {
        return `Error: ${error}`
      })
    } catch (error) {
      return error
    }
  }


  // public async dayPosition(period: String = "") {
  //   const startDate = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
  //   const endDate = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())

  //   const totalDiario = await Shippingcampaign.query()
  //     .whereBetween('created_at', [startDate, endDate])
  //     .count('* as totalDiario').first()

  //   const telefonesValidos = await Shippingcampaign.query()
  //     .where('phonevalid', 1)
  //     .whereBetween('created_at', [startDate, endDate])
  //     .count('* as telefonesValidos').first();

  //   const mensagensEnviadas = await Shippingcampaign.query()
  //     .where('messagesent', 1)
  //     .whereBetween('created_at', [startDate, endDate])
  //     .count('* as mensagensEnviadas').first()

  //   const mensagensRetornadas = await Chat.query()
  //     .where('returned', 1)
  //     .whereBetween('created_at', [startDate, endDate])
  //     .count('* as mensagensRetornadas').first()

  //   const confirmacoes = await Chat.query()
  //     .where('absoluteresp', 1)
  //     .whereBetween('created_at', [startDate, endDate])
  //     .count('* as confirmacoes').first()

  //   const reagendamentos = await Chat.query()
  //     .where('absoluteresp', 2)
  //     .whereBetween('created_at', [startDate, endDate])
  //     .count('* as reagendamentos').first()


  //   const result = {
  //     totalDiario: totalDiario.$extras.totalDiario,
  //     telefonesValidos: telefonesValidos.$extras.telefonesValidos,
  //     mensagensEnviadas: mensagensEnviadas.$extras.mensagensEnviadas,
  //     mensagensRetornadas: mensagensRetornadas.$extras.mensagensRetornadas,
  //     confirmacoes: confirmacoes.$extras.confirmacoes,
  //     reagendamentos: reagendamentos.$extras.reagendamentos
  //   }
  //   return result

  // }

  public async datePosition({ request, response }: HttpContextContract) {
    const { initialdate, finaldate } = request.only(['initialdate', 'finaldate'])
    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }

    try {
      const result = await Database.connection(Env.get('DB_CONNECTION_MAIN')).query()
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
        .orderByRaw(Database.raw('CONVERT(date, shippingcampaigns.created_at)')).toQuery()
      return response.status(201).send(result)
    } catch (error) {
      throw new Error(error)
    }


  }


  public async datePositionSynthetic({ request, response }: HttpContextContract) {
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
      const queryValue = Database.connection('mssql2').query()
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
      const result = await queryValue

      return response.status(201).send(result)
    } catch (error) {
      throw new Error(error)
    }

  }

  public async serviceEvaluationDashboard({ request, response }: HttpContextContract) {

    const { initialdate, finaldate, phonevalid, absoluteresp, interactions, returned, reg, name, attendant, doctor, unit, excluded, cellphone, chat_finished, type_service, closed, report, date_return, last_response }
      = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp',
        'interactions', 'returned', 'reg', 'name', 'attendant', 'doctor', 'unit', 'excluded', 'cellphone',
        'chat_finished', 'type_service', 'closed', 'report', 'date_return', 'last_response'])

    let query = "1=1"
    if (returned)//clientes que enviaram mensagem dentro do sistema
      query += ` and chats.id in (select chats_id from customchats) `
    if (reg)
      query += ` and shippingcampaigns.reg=${reg} `
    if (name)
      query += ` and shippingcampaigns.name like '%${name}%' `
    if (phonevalid && phonevalid !== undefined) {
      query += ` and phonevalid=${phonevalid == 1 ? 1 : 0}`
    }
    if (interactions)
      query += ` and response is not null `
    if (cellphone)
      query += ` and shippingcampaigns.cellphone like '%${cellphone}%' `
    if (absoluteresp == 1)
      query += ` and absoluteresp < 7 `
    else if (absoluteresp == 2)
      query += ` and absoluteresp >= 7 and absoluteresp <9 `
    else if (absoluteresp == 3)
      query += ` and absoluteresp >= 9 `
    if (attendant)
      query += ` and attendant ='${attendant}'`
    if (doctor) {

      query += ` and doctor ='${doctor}' `
    }
    if (unit)
      query += ` and unit='${unit}'`
    if (excluded)
      query += ` and shippingcampaigns.excluded=1 `
    else query += ` and (shippingcampaigns.excluded not in (1) or shippingcampaigns.excluded is null) `
    if (chat_finished)
      query += ` and chat_finished=1 `
    //else query += ` and (chat_finished not in (1) or chat_finished is null) `
    if (type_service)
      query += ` and type_service = '${type_service}'`

    if (last_response) {
      if (last_response == "1")
        query += ` and last_response=1 `
      else if (last_response == "2")
        query += ` and last_response=2 `
    }

    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }

    try {
      const queryResult = Database.connection(Env.get('DB_CONNECTION_MAIN')).query()
        .from('shippingcampaigns')
      if (!closed) {
        queryResult.select(
          'shippingcampaigns.id as idShipp',
          'shippingcampaigns.interaction_id',
          'shippingcampaigns.reg',
          'shippingcampaigns.name',
          'shippingcampaigns.cellphone',
          'shippingcampaigns.cellphoneserialized',
          'chats.id',
          'otherfields',
          'phonevalid',
          'messagesent',
          'chats.created_at',
          'chats.date_return',
          'response',
          'returned',
          'invalidresponse',
          'chatname',
          'chatnumber',
          'absoluteresp',
          'prioritysend',
          'shippingcampaigns.excluded',
          'doctor',
          'unit',
          'attendant',
          Database.raw('(select count(*) from customchats inner join chats ch on customchats.chats_id=ch.id where ch.id=chats.id and viewed=false) as viewed'),
          'chat_finished',
          'last_response',
          'date_first_return',
          'justify_excluded'
        )
        if (report)
          queryResult.select('main_subject', 'responsible',
            'main_subject',
            'report',
            'employee_involved',
            'medic_einvolved',
            'date_limit',
            'responsible_response',
            'root_cause',
            'action',
            'date_limit_action',
            'date_limit_manifest',
            'obs',
            'status',
          )

      }
      if (closed) {
        queryResult.select(
          'shippingcampaigns.id as idShipp',
          'shippingcampaigns.interaction_id',
          'shippingcampaigns.reg',
          'shippingcampaigns.name',
          'shippingcampaigns.cellphone',
          'chats.id',
          'otherfields',
          'phonevalid',
          'messagesent',
          'chats.created_at',
          'chats.date_return',
          'response',
          'returned',
          'invalidresponse',
          'chatname',
          Database.raw('CASE WHEN closed = 0 THEN NULL ELSE absoluteresp END AS absoluteresp'),
          'prioritysend',
          'shippingcampaigns.excluded',
          'doctor',
          'unit',
          'attendant',
          Database.raw('(select count(*) from customchats inner join chats ch on customchats.chats_id=ch.id where ch.id=chats.id and viewed=false) as viewed'),
          'chat_finished',
          'last_response',
          'date_first_return',
          'justify_excluded'

        )
        if (report)
          queryResult.select('main_subject', 'responsible',
            'main_subject',
            'report',
            'employee_involved',
            'medic_einvolved',
            'date_limit',
            'responsible_response',
            'root_cause',
            'action',
            'date_limit_action',
            'date_limit_manifest',
            'obs',
            'status',
          )
      }

      queryResult.leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
      if (!date_return) {
        queryResult.whereBetween('chats.created_at', [initialdate, finaldate])
      }
      if (date_return == "true") {
        queryResult.whereBetween('chats.date_return', [initialdate, finaldate])
      }

      if (report)
        queryResult.leftJoin('manifests', 'chats.id', 'manifests.chat_id')
      //     //.whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])

      queryResult.where('shippingcampaigns.interaction_id', 2)
      queryResult.whereRaw(query)

      const result = await queryResult

      const resultAcumulated = await Database.from('chats')
        .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
        .sumDistinct('absoluteresp as note')
        .count('* as total')
        .where('chats.interaction_id', 2)
        .andWhereBetween('absoluteresp', [0, 10000])
        //.andWhere('absoluteresp','>=','9')
        .whereBetween('chats.created_at', [initialdate, finaldate])
        .whereRaw(query)
        .groupBy('absoluteresp')

      let resultAcumulatedList = resultAcumulated
      let totalEvaluations = 0
      let totalDetractors = 0
      let totalPromoters = 0

      for (const result of resultAcumulated) {
        totalEvaluations = totalEvaluations + result.total
        if (result.note <= 6)
          totalDetractors = totalDetractors + result.total
        if (result.note >= 9 && result.note <= 10)
          totalPromoters = totalPromoters + result.total
      }
      //calcula o percentual do NPS
      const nps = ((totalPromoters * 100) / totalEvaluations) - ((totalDetractors * 100) / totalEvaluations)
      const npsResult = nps < 0 ? 0 : nps
      //UNIDADES****************************************************************** */
      const unitResult = await Database
        .from('chats')
        .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
        .where('chats.interaction_id', 2)
        .whereBetween('chats.created_at', [initialdate, finaldate])
        .andWhereRaw('(shippingcampaigns.excluded not in (1) or shippingcampaigns.excluded is null)')
        .select('unit as station')
        .sum(Database.raw(`CASE WHEN absoluteresp < 7 THEN 1 ELSE 0 END`), 'detrator')
        .sum(Database.raw(`CASE WHEN absoluteresp BETWEEN 7 AND 8 THEN 1 ELSE 0 END`), 'passivo')
        .sum(Database.raw(`CASE WHEN absoluteresp >= 9 THEN 1 ELSE 0 END`), 'promotor')
        .groupBy('unit')
      const resultByStation = unitResult.map(result => ({
        station: result.station,
        detrator: parseInt(result.detrator, 10),
        passivo: parseInt(result.passivo, 10),
        promotor: parseInt(result.promotor, 10)
      }))
      //MEDICO****************************************************************** */
      const doctorResult = await Database
        .from('chats')
        .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
        .where('chats.interaction_id', 2)
        .whereBetween('chats.created_at', [initialdate, finaldate])
        .andWhereRaw('(shippingcampaigns.excluded not in (1) or shippingcampaigns.excluded is null)')
        .select('doctor as medic')
        .sum(Database.raw(`CASE WHEN absoluteresp < 7 THEN 1 ELSE 0 END`), 'detrator')
        .sum(Database.raw(`CASE WHEN absoluteresp BETWEEN 7 AND 8 THEN 1 ELSE 0 END`), 'passivo')
        .sum(Database.raw(`CASE WHEN absoluteresp >= 9 THEN 1 ELSE 0 END`), 'promotor')
        .groupBy('doctor')
      const resultByMedic = doctorResult.map(result => ({
        medic: result.medic,
        detrator: parseInt(result.detrator, 10),
        passivo: parseInt(result.passivo, 10),
        promotor: parseInt(result.promotor, 10)
      }))

      //ATENDENTE****************************************************************** */
      const attendantResult = await Database
        .from('chats')
        .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
        .where('chats.interaction_id', 2)
        .whereBetween('chats.created_at', [initialdate, finaldate])
        .andWhereRaw('(shippingcampaigns.excluded not in (1) or shippingcampaigns.excluded is null)')
        .select('attendant')
        .sum(Database.raw(`CASE WHEN absoluteresp < 7 THEN 1 ELSE 0 END`), 'detrator')
        .sum(Database.raw(`CASE WHEN absoluteresp BETWEEN 7 AND 8 THEN 1 ELSE 0 END`), 'passivo')
        .sum(Database.raw(`CASE WHEN absoluteresp >= 9 THEN 1 ELSE 0 END`), 'promotor')
        .groupBy('attendant')
      const resultByAttendant = attendantResult.map(result => ({
        attendant: result.attendant,
        detrator: parseInt(result.detrator, 10),
        passivo: parseInt(result.passivo, 10),
        promotor: parseInt(result.promotor, 10)
      }))
      //******************************************************************* */

      return response.status(201).send({ result, resultAcumulatedList, resultByStation, resultByMedic, resultByAttendant, npsResult })
    } catch (error) {
      throw new Error(error)
    }

  }


  public async scheduleConfirmationDashboard({ request, response }: HttpContextContract) {

    const { initialdate, finaldate, phonevalid, absoluteresp, interactions, messagesent, invalidresponse, reg, name, unit } =
      request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp', 'interactions', 'messagesent', 'reg', 'name', 'unit'])
    let query = "1=1"
    if (phonevalid) {
      query += ` and phonevalid=${phonevalid}`
    }
    if (messagesent) {
      query += ` and messagesent=${messagesent} and chats.interaction_seq not in (2)`
    }
    if (interactions)
      query += ` and response is not null `

    if (absoluteresp)
      query += ` and absoluteresp=${absoluteresp} and externalstatus='B' `

    if (invalidresponse)
      query += ` and invalidresponse not in ('1','2', 'Sim', 'Não', 'confirmado', 'pode confirmar', '1sim', '10', 'cancelar', '2 cancelar') `

    if (reg)
      query += ` and  shippingcampaigns.reg=${reg}`

    if (name)
      query += ` and  shippingcampaigns.name like '%${name}%' `
    if (unit)
      query += ` and unit_cod = ${unit}`

    const initial = DateTime.fromISO(initialdate, { zone: 'America/Sao_Paulo' }).startOf('day')
    const final = DateTime.fromISO(finaldate, { zone: 'America/Sao_Paulo' }).endOf('day')
    if (!initial.isValid || !final.isValid) {
      throw new Error("Datas inválidas.")
    }

    try {
      const queryAll = Database.connection(Env.get('DB_CONNECTION_MAIN')).query()
        .from('shippingcampaigns')
        .select(
          'shippingcampaigns.interaction_id',
          'shippingcampaigns.reg',
          'shippingcampaigns.name',
          'shippingcampaigns.dateshedule',
          'shippingcampaigns.cellphone',
          'otherfields',
          'phonevalid',
          'messagesent',
          'chats.created_at',
          'response',
          'returned',
          'invalidresponse',
          'chatname',
          'absoluteresp',
          'unit',
          'doctor'
        )
        .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .whereBetween('shippingcampaigns.created_at', [initial.toISO(), final.toISO()])
        .where('shippingcampaigns.interaction_id', 1)
        .andWhereNull('chats.excluded')
        .andWhere('chats.interaction_seq', 1)
        .whereRaw(query)

      //console.log(queryAll.toQuery())

      const queryResult = await queryAll
      return response.status(201).send(queryResult)
    } catch (error) {
      throw new Error(error)
    }

  }

  public async patientToSend(agent: Agent) {
    const agentCompany = await Agent.query().where('id', agent.id).first()
    const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
    const query = Shippingcampaign.query()
      .whereNull('phonevalid')
      .andWhere('messagesent', 0)
      .andWhere('created_at', '>', yesterday)

    if (agentCompany?.company_id) {
      query.andWhere('company_id', agentCompany?.company_id)
    }
    else query.whereNull('company_id')
    query.whereNotExists((subquery) => {
      subquery.select('*').from('chats')
        .whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id')
        .andWhereNull('chats.excluded')
    })

    if (agentCompany?.interaction_priority?.toLocaleUpperCase() === 'CONFIRMATION')
      query.orderByRaw('(interaction_id!=1),RAND()').limit(10)
    else if (agentCompany?.interaction_priority?.toLocaleUpperCase() === 'EVALUATION')
      query.orderByRaw('(interaction_id!=2),RAND()').limit(10)
    else
      query.orderByRaw('RAND()').limit(10)

    const shippingCampaign = await query.first()
    return shippingCampaign
  }


  //CHAMA OUTRO ENDPOINT PARA EXECUTAR A BUSCA DOS PACIENTES
  public async searchSchedulePatients({ auth, request, response }) {
    //await auth.use('api').authenticate()
    console.log("INICIANDO A BUSCA COM WEBHOOK")
    //vai buscar os pacientes que estão no smart
    //WEBHOOK
    const payload = await validateParams(request)
    const params = new URLSearchParams()
    if (payload.date)
      params.append('date', payload.date)
    if (payload.interaction_id)
      params.append('interaction_id', payload.interaction_id)
    if (payload.unit_cod)
      params.append('unit_cod', payload.unit_cod)

    const url = `${process.env.SERVER_EASYTALK}/executeschedulepatients?${params.toString()}`
    console.log("url", url)
    try {
      const response = await axios.get(url, getHeaders())
      //console.log("RESPONSE:", process.env.SERVER_EASYTALK)
      if (response.status === 200) {
        return response.data
      }
    } catch (error) {
      console.log("error:", error)
      return error
    }

  }


  public async executeSchedulePatients({ auth, request, response }) {
    console.log("INICIANDO A BUSCA COM WEBHOOK")
    //const {date, interaction_id, unit} = request
    const params = await validateParams(request)
    const result = await PersistShippingcampaign(params.date, false, params.interaction_id, params?.unit_cod)
    console.timeEnd('Rodei a busca manual');

    return response.status(200).send(result)

  }


  //DASBOARD COM INFORMAÇÕES BASICAS DAS DUAS CAMPANHAS
  public async dashboardGeneral({ auth, request, response }) {
    try {
      const todayStart = DateTime.now().startOf('day')
      const todayEnd = DateTime.now().endOf('day')

      //Buscar capacidade de envios
      //const dailyCapacity = await Agent.query()
      const totalMaxLimitMessage = await Agent
        .query()
        .where('status', 'CONNECTED')
        .andWhere('default_chat', false)
        .andWhere('deleted', false)
        .sum('max_limit_message as total').first()


      // Buscar campanhas no período
      const shippingcampaigns = await Shippingcampaign.query()
        .select('id', 'reg', 'interaction_id', 'phonevalid', 'messagesent')
        .whereBetween('created_at', [
          todayStart.toSQL({ includeOffset: false }),
          todayEnd.toSQL({ includeOffset: false })
        ])

      // Filtragens
      const totalMissing = shippingcampaigns.filter(i => i.phonevalid === null && Boolean(i.messagesent) === false)
      const filteredShendule = shippingcampaigns.filter(i => i.interaction_id === 1)
      const filteredEvalutation = shippingcampaigns.filter(i => i.interaction_id === 2)

      // Buscar chats no período
      const chats = await Chat.query()
        .select('id', 'interaction_id', 'interaction_seq', 'ack', 'returned')
        .whereBetween('created_at', [
          todayStart.toSQL({ includeOffset: false }),
          todayEnd.toSQL({ includeOffset: false })
        ])

      // Filtragens de chats
      const filteredChatSended = chats.filter(i => i.ack >= 2)
      const filteredChatReturned = chats.filter(i => i.ack >= 2 && Boolean(i.returned))
      const filteredChatScheduleSended = chats.filter(
        i => i.interaction_id === 1 && i.interaction_seq === 1 && i.ack >= 2
      )
      const filteredChatScheduleReturned = chats.filter(
        i => i.interaction_id === 1 && i.interaction_seq === 1 && i.ack >= 2 && Boolean(i.returned)
      )
      const filteredChatEvaluationSended = chats.filter(
        i => i.interaction_id === 2 && i.ack >= 2
      )
      const filteredChatEvaluationReturned = chats.filter(
        i => i.interaction_id === 2 && i.ack >= 2 && Boolean(i.returned)
      )


      // Retorno seguro e organizado
      return response.ok({
        date: {
          start: todayStart.toISO(),
          end: todayEnd.toISO()
        },
        agent: {
          description: "dialyCapacity", value: totalMaxLimitMessage?.$extras.total || 0, label: "Capacidade diária"
        },
        shippingcampaigns: [
          { description: "total", value: shippingcampaigns.length, label: "Total Geral" },
          { description: "totalMissing", value: totalMissing.length, label: "Total Faltante" },
          { description: "schedule", value: filteredShendule.length, label: "Total de Confirmações" },
          { description: "evaluation", value: filteredEvalutation.length, label: "Total de Avaliações" },
        ],
        chats: [
          { description: "totalSended", value: filteredChatSended.length, label: "Total de Mensagens Enviadas" },
          { description: "totalReturned", value: filteredChatReturned.length, label: "Total de Mensagens Retornadas" },
          { description: "scheduleSended", value: filteredChatScheduleSended.length, label: "Total de Confirmações Enviadas" },
          { description: "scheduleReturned", value: filteredChatScheduleReturned.length, label: "Total de Confirmações Retornadas" },
          { description: "evaluationSended", value: filteredChatEvaluationSended.length, label: "Total de Avaliações Enviadas" },
          { description: "evaluationReturned", value: filteredChatEvaluationReturned.length, label: "Total de Avaliações Retornadas" },
        ]
      })
    } catch (error) {
      console.error('Erro no dashboardGeneral:', error)
      return response.status(500).json({ error: 'Erro ao buscar dados do dashboard' })
    }
  }



}










