import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import { getSchedulesApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'
async function greeting(message: String) {
  const responseList = new ResponsesController()
  const greeting = await responseList.index({local:'greeting'}) //['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀']
  const presentation = await responseList.index({local:'presentation'})//['Eu me chamo Iris', 'Eu sou a Iris', 'Aqui é a Iris']
  return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{presentation}', presentation[Math.floor(Math.random() * presentation.length)])
}

export default class DatasourceApisController {

  //BUSCAR OS PACIENTES DE AGENDAMENTO NO KLINGO
  public async getSchedules({ auth, response }: HttpContextContract) {
    //await auth.use('api').authenticate()
    //chmamar a API DO KLINGO
    const schedule_list = await getSchedulesApi("2025-01-07")

    for (const data of schedule_list) {
      try {
        //console.log(data)
        const reg = String(data.id_paciente).replace(/[^0-9.-]/g, "")
        const gender = data.sexo=="M"?"Sr.":"Sra."
        const name_message=String(data.nome).trim().split(' ')[0]
        const date_schedule_message = DateTime.fromFormat(data.datahora,"yyyy-MM-dd HH:mm").toFormat("dd/MM/yyyy HH:mm")
        const shipping = new Shippingcampaign()
        shipping.interaction_id = 1
        shipping.interaction_seq = 1
        shipping.reg = parseInt(reg)
        shipping.dateshedule = data.datahora
        shipping.idexternal = data.id_marcacao
        shipping.name = String(data.nome).trim()
        shipping.cellphone = String(data.celular).replace(/[^0-9]+/g, ''); //data.cellphone.replace("(", "").replace("-", "")
        if (!await ValidatePhone(data.cellphone))
          shipping.phonevalid = false
        shipping.messagesent = false
        shipping.message = await greeting(String(`{greeting},{presentation}, atendente virtual do Cob, o motivo do meu contato ${gender} ${name_message} é para confirmar o horário conosco, agendado para o dia *${date_schedule_message}* na unidade ${data.unidade} com Dr(a). ${data.medico} podemos confirmar? *1* para Sim *2* para Desmarcar ou Reagendar.`).replace(/@p[0-9]/g, '?'))
        //shipping.otherfields = data.otherfields
        shipping.doctor = String(data.medico).trim()
        shipping.unit = String(data.unidade).trim()
        shipping.covenant = ''

        const verifyExist = await Shippingcampaign.query().where('reg', reg)
          .andWhere('dateshedule', data.datahora).first()
        if (!verifyExist) {
          await Shippingcampaign.create(shipping)
        }
      } catch (error) {
        console.log("Erro 44454>>>>", error)
      }

    }

    return response.status(200).send("OK")
    // const data = await Chat.query()
    //return response.status(200).send(data)
  }

  //FAZ A CONFIRMAÇÃO NO KLINGO
  public async confirmOrCancelScheduleApi({ auth, response }: HttpContextContract) {
    //await auth.use('api').authenticate()
    //chmamar a API DO KLINGO
    const date_start = DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm")
    const date_end = DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm")
    try {
      const confirmCancel = await Chat.query()
      .whereBetween('created_at',[date_start,date_end])
      .andWhere('externalstatus', 'A')

      for (const data of confirmCancel) {

      }

      console.log(">>", confirmCancel)

    } catch (error) {

    }

  //   for (const data of schedule_list) {
  //     try {

  //     } catch (error) {
  //       console.log("Erro 44454>>>>", error)
  //     }

  //   }

  //   return response.status(200).send("OK")
  // }



}


