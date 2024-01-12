import { typeInferListFromConfig } from '@adonisjs/core/build/config';

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { executeWhatsapp } from '../../Services/whatsapp-web/whatsapp'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'
import Env from '@ioc:Adonis/Core/Env'

import { DateFormat, InvalidResponse } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'
import { Response } from '@adonisjs/core/build/standalone'
import Agent from 'App/Models/Agent';

export default class ShippingcampaignsController {

  static get connection() {
    return 'mysql';
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

  public async maxLimitSendMessage(agent: Agent) {
    const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
    const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
    const chatName = agent.name
    const countMessage = await Chat.query()
      .countDistinct('shippingcampaigns_id as tot')
      .where('chatname', chatName)
      .whereBetween('created_at', [dateStart, dateEnd]).first()

    //console.log("PASSEI LIMITE DE ENVIO NA CONTROLLER 1516", countMessage)
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

      console.log(">>>>>>>>>>", result)




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



    const { initialdate, finaldate, phonevalid, absoluteresp, interactions } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp', 'interactions'])

    let query = "1=1"
    if (phonevalid && phonevalid !== undefined) {
      query += ` and phonevalid=${phonevalid == 1 ? 1 : 0}`
    }
    if (interactions)
      query += ` and response is not null `

    if (absoluteresp == 1)
      query += ` and absoluteresp < 7 `
    else if (absoluteresp == 2)
      query += ` and absoluteresp >= 7 and absoluteresp <9 `
    else if (absoluteresp == 3)
      query += ` and absoluteresp >= 9 `

    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }

    //return { query, initialdate, finaldate }

    try {
      const result = await Database.connection(Env.get('DB_CONNECTION_MAIN')).query()
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
        .whereBetween('chats.created_at', [initialdate, finaldate])
        .where('shippingcampaigns.interaction_id', 2)
        .whereRaw(query)



      //console.log("result", result)
      const resultAcumulated = await Chat.query()
        .sumDistinct('absoluteresp as note')
        .count('* as total')
        .where('interaction_id', 2)
        .andWhereBetween('absoluteresp', [0, 10])
        .whereBetween('created_at', [initialdate, finaldate])
        .groupBy('absoluteresp')



      let resultAcumulatedList = []
      let totalEvaluations = 0
      let totalDetractors = 0
      let totalPromoters = 0

      //Total de detratores, promotores e Array de notas (acumulado)
      for (const result of resultAcumulated) {
        resultAcumulatedList.push(result.$extras)
        totalEvaluations = totalEvaluations + result.$extras.total
        if (result.$extras.note <= 6)
          totalDetractors = totalDetractors + result.$extras.total
        if (result.$extras.note >= 9 && result.$extras.note <= 10)
          totalPromoters = totalPromoters + result.$extras.total
      }
      //console.log("RESUUUULT", resultAcumulatedList)
      //calcula o percentual do NPS
      const npsResult = ((totalPromoters * 100) / totalEvaluations) - ((totalDetractors * 100) / totalEvaluations)

      // console.log("% detratores", percentDetractors)
      // console.log("% promoters", percentPromoters)
      // console.log("NPS", npsResult)
      // console.log("total geral", totalEvaluations)
      // console.log("total detratores", totalDetractors)
      // console.log("total promoters", totalPromoters)


      const otherfields = result.map(item => JSON.parse(item.otherfields))
      const station = otherfields.map(item => item.station)
      const medic = otherfields.map(item => item.medic)

      let itemFilter
      const resultFinal = result.map(item => {
        const otherfieldsObj = JSON.parse(item.otherfields);

        // if (item.absoluteresp !== null) {
        //   itemFilter = item
        // }
        // return {
        //   itemFilter,
        //   station: otherfieldsObj.station,
        //   medic: otherfieldsObj.medic,
        //   attendant: otherfieldsObj.attendant
        // }

        return {
          ...item,
          station: otherfieldsObj.station,
          medic: otherfieldsObj.medic,
          attendant: otherfieldsObj.attendant
        };


      });

      //console.log("ITEM>>>>>", resultFinal)

      // Função para classificar a pontuação
      function getClassification(score) {
        if (score <= 7) {
          return 'detrator';
        } else if (score > 7 && score <= 8) {
          return 'passivo';
        } else if (score > 8 && score <= 10) {
          return 'promotor';
        }
      }

      // Objeto para armazenar as contagens por estação e classificação
      const countsByStation = {};
      const countsByMedic = {}
      const countsByAttendant = {}

      // Calcular as contagens
      resultFinal.forEach(item => {
        const { attendant, station, absoluteresp, medic } = item;
        const classification = getClassification(absoluteresp);
        // recepcao
        if (item.messagesent && item.absoluteresp !== null) {
          if (!countsByStation[station]) {
            countsByStation[station] = {
              detrator: 0,
              passivo: 0,
              promotor: 0
            };
          }
          //console.log("STATION======>", countsByStation[station])
          countsByStation[station][classification]++;
        }

        //MEDIC********* */
        if (item.messagesent && item.absoluteresp !== null) {
          if (!countsByMedic[medic]) {
            countsByMedic[medic] = {
              detrator: 0,
              passivo: 0,
              promotor: 0
            };
          }
          countsByMedic[medic][classification]++;

        }

        //RECEP********* */
        if (item.messagesent && item.absoluteresp !== null) {
          if (!countsByAttendant[attendant]) {
            countsByAttendant[attendant] = {
              detrator: 0,
              passivo: 0,
              promotor: 0
            };
          }
          countsByAttendant[attendant][classification]++;
        }

      });

      const resultByStation = Object.entries(countsByStation).map(([station, counts]) => ({
        station,
        ...counts
      }));

      const resultByMedic = Object.entries(countsByMedic).map(([medic, counts]) => ({
        medic,
        ...counts
      }));

      const resultByAttendant = Object.entries(countsByAttendant).map(([attendant, counts]) => ({
        attendant,
        ...counts
      }));

      return response.status(201).send({ result, resultAcumulatedList, resultByStation, resultByMedic, resultByAttendant, npsResult })
    } catch (error) {
      throw new Error(error)
    }

  }

  public async scheduleConfirmationDashboard({ request, response }: HttpContextContract) {

    const { initialdate, finaldate, phonevalid, absoluteresp, interactions, messagesent, invalidresponse } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp', 'interactions', 'messagesent'])

    let query = "1=1"
    if (phonevalid) {
      query += ` and phonevalid=${phonevalid}`
    }
    if (messagesent) {
      query += ` and messagesent=${messagesent} `
    }
    if (interactions)
      query += ` and response is not null `

    if (absoluteresp)
      query += ` and absoluteresp=${absoluteresp} `

    if (invalidresponse)
      query += ` and invalidresponse not in ('1','2', 'Sim', 'Não', 'confirmado', 'pode confirmar', '1sim', '10', 'cancelar', '2 cancelar') `


    if (!DateTime.fromISO(initialdate).isValid || !DateTime.fromISO(finaldate).isValid) {
      throw new Error("Datas inválidas.")
    }


    //return { query, initialdate, finaldate }

    try {
      const result = await Database.connection(Env.get('DB_CONNECTION_MAIN')).query()
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

      return response.status(201).send(result)
    } catch (error) {
      throw new Error(error)
    }

  }


}
