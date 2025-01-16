import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'



async function greeting(message: String) {
  const responseList = new ResponsesController()
  const greeting = await responseList.index({ local: 'greeting' }) //['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀']
  const presentation = await responseList.index({ local: 'presentation' })//['Eu me chamo Iris', 'Eu sou a Iris', 'Aqui é a Iris']
  return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{presentation}', presentation[Math.floor(Math.random() * presentation.length)])
}

export default class DatasourceApisController {

  //FUNÇÃO PARA BUSCAR OS PACIENTES AGENDADOS NO KLINGO
  public async getSchedulesInternal(date: string) {
    const schedule_list = await getSchedulesApi(date)
    for (const data of schedule_list) {
      if (data.id_paciente == 5144) {
        try {
          const reg = String(data.id_paciente).replace(/[^0-9.-]/g, "")
          const gender = data.sexo == "M" ? "Sr." : "Sra."
          const name_message = String(data.nome).trim().split(' ')[0]
          const date_schedule_message = DateTime.fromFormat(data.datahora, "yyyy-MM-dd HH:mm").toFormat("dd/MM/yyyy HH:mm")
          const shipping = new Shippingcampaign()
          shipping.interaction_id = 1
          shipping.interaction_seq = 1
          shipping.reg = parseInt(reg)
          shipping.dateshedule = data.datahora
          shipping.idexternal = data.id_marcacao
          shipping.name = String(data.nome).trim()
          shipping.cellphone = String(data.celular).replace(/[^0-9]+/g, ''); //data.cellphone.replace("(", "").replace("-", "")
          if (!await ValidatePhone(shipping.cellphone))
            shipping.phonevalid = false
          shipping.messagesent = false
          shipping.message = await greeting(String(`{greeting},{presentation}, atendente virtual do Cob, o motivo do meu contato ${gender} ${name_message} é para confirmar o horário conosco, agendado para o dia *${date_schedule_message}* na unidade ${data.unidade} com Dr(a). ${data.medico} podemos confirmar? *1* para Sim *2* para Desmarcar.`).replace(/@p[0-9]/g, '?'))
          shipping.otherfields = `{"address":"RUA TESTE","medic":"${String(data.medico).trim()}","schedule":"${data.datahora}","phone_unit":"31222233331"}`
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
          return false
        }
      }

    }
    return true
  }


  public async confirmOrCancelScheduleInternal() {
    //await auth.use('api').authenticate()
    //chmamar a API DO KLINGO
    const date_start = DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm")
    const date_end = DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm")
    try {
      const confirmCancel = await Chat.query()
        .whereBetween('created_at', [date_start, date_end])
        .andWhere('externalstatus', 'A')
        .andWhere('interaction_id', 1)

      console.log("Executando confirm cancel:", confirmCancel)

      for (const data of confirmCancel) {
        if (data.absoluteresp === 1) {
          //FAZ A CONFIRMAÇÃO - STATUS C
          console.log(confirmCancel)
          //await confirmOrCancelScheduleApi()
        } else if (data.absoluteresp === 2) {
          //FAZ O CANCELAMENTO - STATUS N
          //await confirmOrCancelScheduleApi()
        }

      }

      console.log(">>", confirmCancel)

    } catch (error) {

    }

  }




  //END POINT BUSCAR OS PACIENTES DE AGENDAMENTO NO KLINGO
  public async getSchedules({ auth, request, response }: HttpContextContract) {
    //chmamar a API DO KLINGO
    const { date } = request.requestData//DateTime.now().toFormat("yyyy-MM-dd")
    console.log(">>", date)

    await this.getSchedulesInternal(date)
    return response.status(200).send("OK")
  }

  //FAZ A CONFIRMAÇÃO NO KLINGO
  public async confirmOrCancelSchedule({ auth, response }: HttpContextContract) {
    //await auth.use('api').authenticate()
    //chmamar a API DO KLINGO
    const date_start = DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm")
    const date_end = DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm")
    try {
      const confirmCancel = await Chat.query()
        .whereBetween('created_at', [date_start, date_end])
        .andWhere('externalstatus', 'A')
        .andWhere('interaction_id', 1)

      let result
      for (const data of confirmCancel) {
        if (data.absoluteresp === 1) {
          //FAZ A CONFIRMAÇÃO - STATUS C
          result = await confirmOrCancelScheduleApi(data.idexternal, "C", "Confirmado.")
        } else {
          //FAZ O CANCELAMENTO - STATUS N
          result = await confirmOrCancelScheduleApi(data.idexternal, "N", "Não Confirmado.")
        }

        if (result)
          await Chat.query().where("id", data.id).update({ externalstatus: 'B' })

      }

    } catch (error) {
      return error
    }

  }
}


