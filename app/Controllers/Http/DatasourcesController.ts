import { Env } from '@ioc:Adonis/Core/Env';
// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Interaction from 'App/Models/Interaction';
import { DateTime } from 'luxon';

import { DateFormat } from '../../Services/whatsapp-web/util'

export default class DatasourcesController {


  //retornar todos as querys de campaign
  async DataSource() {

    const interactionList = await Interaction.query().where('status', '=', 1)
    //console.log("queryList:::", interactionList)
    for (const interaction of interactionList) {
      if (interaction.id == 1) {
        //console.log("CONFIRMAÇÃO DE AGENDAS", interaction.name)
        return await this.scheduledPatients()
      } else
        if (interaction.id == 2) {
          console.log("Teste de envio amadurecimento do chip", interaction.name)
        }
      if (interaction.id == 3) {
        console.log("AVALIAÇÃO DOS PACIENTES", interaction.name)
      }

    }



  }

  async scheduledPatients() {

    async function greeting(message: String) {
      const greeting = ['Olá!', 'Oi tudo bem?', 'Saudações!', 'Oi como vai?']
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
      return result
    } catch (error) {
      return { "ERRO": "ERRO 154212", error }
    }
  }



  async confirmSchedule(id: number) {
    const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())

    const query = `update agm set AGM_CONFIRM_STAT = 'C',
                   AGM_CONFIRM_OBS='NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${date}',
                   AGM_CONFIRM_USR = 'NEOCONFIRM'
                   where agm_id = ${id}`
    try {
      //console.log("EXECUTANDO UPDATE NO SMART...", query)
      const result = await Database.connection('mssql').rawQuery(query)
    } catch (error) {
      return error
    }

  }


}
