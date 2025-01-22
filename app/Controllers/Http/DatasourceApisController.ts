import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Unit from 'App/Models/Unit'
import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'

//FUNÇÃO PARA GERAR A MENSAGEM
async function greeting(message: String, schedule: Object) {
  const responseList = new ResponsesController()
  const greeting = await responseList.index({ local: 'greeting' }) //['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀']
  const presentation = await responseList.index({ local: 'presentation' })//['Eu me chamo Iris', 'Eu sou a Iris', 'Aqui é a Iris']
  const askschedule = await responseList.index({ local: 'askschedule' })
  const gender = schedule.sexo == "M" ? "Sr." : "Sra."
  const date_schedule_message = DateTime.fromFormat(schedule.datahora, "yyyy-MM-dd HH:mm").toFormat("dd/MM/yyyy HH:mm")
  const name_message = String(schedule.nome).trim().split(' ')[0]
  const medic = String(schedule.medico).trim().split(' ')[0]
  const name_unit = String(schedule.unidade)

  return String(message.replace('{greeting}', greeting)
    .replace('{presentation}', presentation)
    .replace('{askschedule}', askschedule)
    .replace('{gender}', gender)
    .replace('{name_message}', name_message)
    .replace('{medic}', medic)
    .replace('{name_unit}', name_unit)
    .replace('{date_schedule_message}', date_schedule_message)).replace(/@p[0-9]/g, '?')
}

//FUNÇÃO PARA GERAR O OTHERFIELDS KLINGO
async function otherFields(schedule: Object) {
  let payLoad: Unit | null
  let value: string | null
  if (schedule && schedule.unidade_id) {
    payLoad = await Unit.query().where('id_unit', schedule.unidade_id).first()
    return value = `{"address_unit":"${payLoad?.address}","medic":"${String(schedule.medico).trim()}","schedule":"${schedule.datahora}","phone_unit":"${payLoad?.phone}","name_unit":"${payLoad?.name}"}`
  }
  return null
}

//FUNÇÃO PARA PREPARAR OS DADOS ARRAY BUSCADO DO KLINGO ANTES DE ARMAZENAR O SHIPPINGCAMPAIGN
function prepareSchedules(records: object[]): object[] {
  // Filtra apenas registros com status_confirmacao igual a "A Confirmar"
  records = records.filter(item => item.status_confirmacao === "A Confirmar");
  // Agrupa os registros por id_paciente
  const groupedByPatient = records.reduce<Record<string, object[]>>((acc, record) => {
    const key = record.id_paciente.toString();
    acc[key] = acc[key] || [];
    acc[key].push(record);
    return acc;
  }, {});
  // Para cada grupo, pega apenas o registro com a data mais antiga
  const oldestRecords = Object.values(groupedByPatient).map((group) => {
    // Obtém todos os id_marcacao no grupo
    const allIds = group.map(item => item.id_marcacao);
    // Encontra o registro com a data mais antiga
    const oldest = group.reduce((oldest, current) => {
      return new Date(current.datahora) < new Date(oldest.datahora) ? current : oldest;
    });
    // Adiciona o atributo id_schedule ao registro mais antigo
    oldest.idexternal_array = allIds;
    return oldest;
  });

  return oldestRecords;
}


export default class DatasourceApisController {

  //FUNÇÃO PARA BUSCAR OS PACIENTES AGENDADOS NO KLINGO
  public async getSchedulesInternal(date: string) {
    const schedule_list =await prepareSchedules(await getSchedulesApi(date))
    // console.log("FINAL FUNÇAÕ")
    //return schedule_list
    //const schedule_list =await getSchedulesApi(date)

    for (const data of schedule_list) {
      //if (data.id_paciente == 5144 || data.id_paciente == 28724 || data.id_paciente == 5845 || data.id_paciente == 5178) {
        try {
          const reg = String(data.id_paciente).replace(/[^0-9.-]/g, "")

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
          shipping.message = await greeting(String(`{greeting} {presentation} {askschedule}`), data)
          shipping.otherfields = String(await otherFields(data))
          shipping.doctor = String(data.medico).trim()
          shipping.unit = String(data.unidade).trim()
          shipping.covenant = ''
          shipping.idexternal_array = String(data.idexternal_array)

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

      if (!confirmCancel || confirmCancel.length === 0) return
      let result
      for (const data of confirmCancel) {
        console.log("Executando Confirmação e Cancelamento no Klingo")
        if (data.absoluteresp === 1) {
          //FAZ A CONFIRMAÇÃO - STATUS C
          
          result = await confirmOrCancelScheduleApi(data.idexternal, 'C', 'Confirmado')
        } else if (data.absoluteresp === 2) {
          //FAZ O CANCELAMENTO - STATUS N
          result = await confirmOrCancelScheduleApi(data.idexternal, 'N', 'Não Confirmada')
        }
        if (result)
          await Chat.query().where("id", data.id).update({ externalstatus: 'B' })
      }

    } catch (error) {
      console.error("Erro ao processar confirmações ou cancelamentos:", error);

    }

  }


  //END POINT BUSCAR OS PACIENTES DE AGENDAMENTO NO KLINGO
  public async getSchedules({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    //chmamar a API DO KLINGO
    const { date } = request.requestData//DateTime.now().toFormat("yyyy-MM-dd")
    const payLoad = await this.getSchedulesInternal(date)
    return response.status(200).send(payLoad)
  }

  //FAZ A CONFIRMAÇÃO NO KLINGO
  public async confirmOrCancelSchedule({ auth }: HttpContextContract) {
    await auth.use('api').authenticate()
    await this.confirmOrCancelScheduleInternal()

  }
}


