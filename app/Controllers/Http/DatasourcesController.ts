import { Env } from '@ioc:Adonis/Core/Env';
// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat';
import Interaction from 'App/Models/Interaction';
import { DateTime } from 'luxon';

import { DateFormat, InvalidResponse } from '../../Services/whatsapp-web/util'

export default class DatasourcesController {


  //retornar todos as querys de campaign
  async DataSource() {
    const interactionList = await Interaction.query().where('status', '=', 1)
    let schedulePatientsArray: any[] = []
    let serviceEvaluationArray: any[] = []

    try {
      for (const interaction of interactionList) {
        if (interaction.id == 1) {
          await Database.manager.close('mssql')
          //return await this.scheduledPatients()
          schedulePatientsArray = await this.scheduledPatients()
        } else
          if (interaction.id == 2) {
            await Database.manager.close('mssql')
            serviceEvaluationArray = await this.serviceEvaluation()
          }
        if (interaction.id == 3) {
          console.log("Teste de envio amadurecimento do chip", interaction.name)
        }
      }
      const data = [...schedulePatientsArray, ...serviceEvaluationArray]
      return data
    }
    catch (error) {
      return
    }
  }

  async scheduledPatients() {


    async function greeting(message: String) {
      const greeting = ['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀']
      const presentation = ['Eu me chamo Iris', 'Eu sou a Iris', 'Aqui é a Iris']
      return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{presentation}', presentation[Math.floor(Math.random() * presentation.length)])
    }
    const pacQueryModel = await Interaction.find(1)
    const env = process.env.NODE_ENV
    let pacQuery

    if (env === 'development')
      pacQuery = pacQueryModel?.querydev
    else pacQuery = pacQueryModel?.query

    try {
      const result = await Database.connection('mssql').rawQuery(pacQuery)
      for (const data of result) {
        const message = await greeting(data.message)
        data.message = message
      }
      //console.log("RESULTADO", result)
      await Database.manager.close('mssql')
      return result
    } catch (error) {
      return { "ERRO": "ERRO 154212", error }
    }
  }
  async confirmSchedule(chat: Chat, chatOtherFields: String = "") {

    const dateNow = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    const dateSchedule = DateTime.fromFormat(chatOtherFields['schedule'], 'yyyy-MM-dd HH:mm')//converte string para data
    const startOfDay = await DateFormat("yyyy-MM-dd 00:00", dateSchedule)
    const endOfDay = await DateFormat("yyyy-MM-dd 23:59", dateSchedule)

    try {
      const query = await Database.connection('mssql')
        .from('agm')
        .where('agm_pac', chat.reg)
        .whereBetween('agm_hini', [startOfDay, endOfDay])
        .whereNotIn('agm_stat', ['C', 'B'])
        .whereNotIn('agm_confirm_stat', ['C'])
        .update({
          AGM_CONFIRM_STAT: 'C',
          AGM_CONFIRM_OBS: `NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
          AGM_CONFIRM_USR: 'NEOCONFIRM'
        })
      await Database.manager.close('mssql')
      //console.log("QUERY CONFIRMAÇÃO", query)
      return query

    } catch (error) {
      return error
    }
  }

  async confirmScheduleAll() {

    const dateNow = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    const startOfDay = await DateFormat("yyyy-MM-dd 00:00", DateTime.local())
    const endOfDay = await DateFormat("yyyy-MM-dd 23:59", DateTime.local())
    //************************************** */
    const dateSchedule = DateTime.fromFormat(chatOtherFields['schedule'], 'yyyy-MM-dd HH:mm')//converte string para data

    console.log("passei aqui....", dateNow)

    const returnChats = await Chat.query()
      .whereBetween('created_at', [startOfDay, endOfDay])
      .andWhere('externalstatus', 'A')



    //return { dateNow, startOfDay, endOfDay, returnChats }
    try {

      for (const chat of returnChats) {
        const query = await Database.connection('mssql')
          .from('agm')
          .where('agm_pac', chat.reg)
          .whereBetween('agm_hini', [startOfDay, endOfDay])
          .whereNotIn('agm_stat', ['C', 'B'])
          .whereNotIn('agm_confirm_stat', ['C'])
          .update({
            AGM_CONFIRM_STAT: 'C',
            AGM_CONFIRM_OBS: `NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
            AGM_CONFIRM_USR: 'NEOCONFIRM'
          }).toQuery()

        console.log(query)
      }

      await Database.manager.close('mssql')
      //console.log("QUERY CONFIRMAÇÃO", query)
      //return query

    } catch (error) {
      return error
    }
  }

  async cancelSchedule(chat: Chat, chatOtherFields: String = "") {
    const dateNow = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    const dateSchedule = DateTime.fromFormat(chatOtherFields['schedule'], 'yyyy-MM-dd HH:mm')//converte string para data
    const startOfDay = await DateFormat("yyyy-MM-dd 00:00", dateSchedule)
    const endOfDay = await DateFormat("yyyy-MM-dd 23:59", dateSchedule)

    let _invalidResponse = ""
    if (await InvalidResponse(chat.invalidresponse) == false) {
      _invalidResponse = chat.invalidresponse
    }

    try {
      const query = await Database.connection('mssql')
        .from('agm')
        .where('agm_pac', chat.reg)
        .whereBetween('agm_hini', [startOfDay, endOfDay])
        .whereNotIn('agm_stat', ['C', 'B'])
        .whereNotIn('agm_confirm_stat', ['C'])
        .update({
          AGM_CONFIRM_STAT: 'N',
          AGM_CONFIRM_USR: 'NEOCONFIRM',
          //AGM_STAT: 'A',
          //AGM_EXT: 1,
          //AGM_CONFIRM_OBS: `Desmarcado por NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
          AGM_CONFIRM_OBS: _invalidResponse + ` (Desmarcado por NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow})`,
          AGM_CONFIRM_DTHR: dateNow,
          AGM_CONFIRM_MOC: 'IRI'
          //AGM_CANC_USR_LOGIN: 'NEOCONFIRM'
        })
      await Database.manager.close('mssql')
      //console.log("QUERY cancelamento", query)
      return query

    } catch (error) {
      return error
    }
  }


  async serviceEvaluation() {
    async function greeting(message: String) {
      const greeting = ['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀']
      const question = ['Gostaríamos de avaliar a sua experiência recente em nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você indicaria o nosso Núcleo de Excelência em Oftalmologia a um amigo ou parente?',
        'Queremos saber mais sobre a sua consulta mais recente ao nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou membro da família?',
        'Estamos interessados em ouvir sua opinião sobre sua experiência mais recente em nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você indicaria o Núcleo de Excelência em Oftalmologia a alguém que você conhece?',
        'Queremos entender melhor sua experiência recente em nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou familiar?',
      ]
      return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{question}', question[Math.floor(Math.random() * question.length)])
    }
    const pacQueryModel = await Interaction.find(2)
    const env = process.env.NODE_ENV
    let pacQuery

    if (env === 'development')
      pacQuery = pacQueryModel?.querydev
    else pacQuery = pacQueryModel?.query

    try {
      const result = await Database.connection('mssql').rawQuery(pacQuery)
      for (const data of result) {
        const message = await greeting(data.message)
        data.message = message
      }
      //console.log("RESULTADO", result)
      await Database.manager.close('mssql')
      return result
    } catch (error) {
      return { "ERRO": "ERRO 21221", error }
    }

  }




}
