import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Log from 'App/Models/Log'
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
// function prepareSchedules(records: object[]): object[] {
//   // Filtra apenas registros com status_confirmacao igual a "A Confirmar"
//   records = records.filter(item => item.status_confirmacao_id == null);
//   // Agrupa os registros por id_paciente
//   const groupedByPatient = records.reduce<Record<string, object[]>>((acc, record) => {
//     const key = record.id_paciente.toString();
//     acc[key] = acc[key] || [];
//     acc[key].push(record);
//     return acc;
//   }, {});
//   // Para cada grupo, pega apenas o registro com a data mais antiga
//   const oldestRecords = Object.values(groupedByPatient).map((group) => {
//     // Obtém todos os id_marcacao no grupo
//     const allIds = group.map(item => item.id_marcacao);
//     // Encontra o registro com a data mais antiga
//     const oldest = group.reduce((oldest, current) => {
//       return new Date(current.datahora) < new Date(oldest.datahora) ? current : oldest;
//     });
//     // Adiciona o atributo id_schedule ao registro mais antigo
//     oldest.idexternal_array = allIds;
//     return oldest;
//   });

//   return oldestRecords;
// }

type KlingoSchedule = {
  status_confirmacao_id: any
  id_paciente: string | number
  id_marcacao: any
  datahora: string | Date
  // ... outros campos que você usa depois
  idexternal_array?: any[]
}

function prepareSchedules(records?: unknown): KlingoSchedule[] {
  // 1) garante array
  if (!Array.isArray(records)) {
    console.log('[prepareSchedules] records inválido (não é array):', records)
    return []
  }

  // 2) filtra somente itens "A Confirmar" (status_confirmacao_id == null)
  const filtered = records.filter((item): item is KlingoSchedule => {
    if (!item || typeof item !== 'object') return false
    const it = item as any
    return it.status_confirmacao_id == null && it.id_paciente != null && it.datahora != null
  })

  if (filtered.length === 0) return []

  // 3) agrupa por paciente
  const groupedByPatient = filtered.reduce<Record<string, KlingoSchedule[]>>((acc, record) => {
    const key = String(record.id_paciente)
      ; (acc[key] ??= []).push(record)
    return acc
  }, {})

  // 4) pega o mais antigo por paciente e adiciona idexternal_array
  const oldestRecords = Object.values(groupedByPatient).map((group) => {
    const allIds = group.map((item) => item.id_marcacao)

    const oldest = group.reduce((oldest, current) => {
      const tOld = Date.parse(String(oldest.datahora))
      const tCur = Date.parse(String(current.datahora))

      // se alguma data for inválida, mantém o "oldest" atual
      if (!Number.isFinite(tCur)) return oldest
      if (!Number.isFinite(tOld)) return current

      return tCur < tOld ? current : oldest
    })

    // evita mutar objeto original (opcional)
    return { ...oldest, idexternal_array: allIds }
  })

  return oldestRecords
}


//FUNÇÃO QUE RETORNA O IDEXTERNO OU IDEXTERNO_ARRAY
async function returnIdExternal(chatObject: object): Promise<number[]> {
  if (chatObject?.shippingcamapgn?.idexternal_array) {
    // Divide a string em partes e converte para números
    return chatObject.shippingcamapgn.idexternal_array
      .split(',')
      .map(item => parseInt(item.trim(), 10)) // Remove espaços e converte para número
      .filter(item => !isNaN(item)); // Remove valores inválidos
  } else {
    return [chatObject.idexternal]
  }
}

export default class DatasourceApisController {

  //FUNÇÃO PARA BUSCAR OS PACIENTES AGENDADOS NO KLINGO
  // public async getSchedulesInternal(date: string) {
  //   const schedule_list = await prepareSchedules(await getSchedulesApi(date))
  //   console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", schedule_list)

  //   const date_start = DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm");
  //   for (const data of schedule_list) {
  //     try {
  //       const reg = String(data.id_paciente).replace(/[^0-9.-]/g, "")
  //       const shipping = new Shippingcampaign()
  //       shipping.interaction_id = 1
  //       shipping.interaction_seq = 1
  //       shipping.reg = parseInt(reg)
  //       shipping.dateshedule = data.datahora
  //       shipping.idexternal = data.id_marcacao
  //       shipping.name = String(data.nome).trim()
  //       shipping.cellphone = String(data.celular).replace(/[^0-9]+/g, ''); //data.cellphone.replace("(", "").replace("-", "")
  //       if (!await ValidatePhone(shipping.cellphone))
  //         shipping.phonevalid = false
  //       shipping.messagesent = false
  //       shipping.message = await greeting(String(`{greeting} {presentation} {askschedule}`), data)
  //       shipping.otherfields = String(await otherFields(data))
  //       shipping.doctor = String(data.medico).trim()
  //       shipping.unit = String(data.unidade).trim()
  //       shipping.covenant = ''
  //       shipping.idexternal_array = String(data.idexternal_array)
  //       shipping.gupshupParams = "[" + data.nome + "," + data.datahora + "," + data.unidade + "," + data.medico + "]" ?? null  //data.gupshup_params ?? null

  //       const verifyExist = await Shippingcampaign.query().where('reg', reg)
  //         .andWhere('dateshedule', data.datahora)
  //         .andWhere('created_at', '>=', date_start).first()

  //       if (!verifyExist) {
  //         await Shippingcampaign.create(shipping)
  //       }

  //     } catch (error) {
  //       console.log("Erro 44454>>>>", error)
  //       return false
  //     }
  //   }
  //   return true
  // }

  public async getSchedulesInternal(date: string) {
    // Helper: tenta converter `datahora` para "dd/LL/yyyy HH:mm"
    const formatKlingoDate = (datahora: any) => {
      const raw = String(datahora ?? "").trim()
      if (!raw) return ""

      // 1) ISO
      const iso = DateTime.fromISO(raw, { zone: "America/Sao_Paulo" })
      if (iso.isValid) return iso.toFormat("dd/LL/yyyy HH:mm")

      // 2) "yyyy-MM-dd HH:mm"
      const fmt1 = DateTime.fromFormat(raw, "yyyy-MM-dd HH:mm", { zone: "America/Sao_Paulo" })
      if (fmt1.isValid) return fmt1.toFormat("dd/LL/yyyy HH:mm")

      // 3) "yyyy-MM-dd HH:mm:ss"
      const fmt2 = DateTime.fromFormat(raw, "yyyy-MM-dd HH:mm:ss", { zone: "America/Sao_Paulo" })
      if (fmt2.isValid) return fmt2.toFormat("dd/LL/yyyy HH:mm")

      // 4) fallback: mantém como veio
      return raw
    }
    const schedule_list = await prepareSchedules(await getSchedulesApi(date))
    const date_start = DateTime.now().setZone("America/Sao_Paulo").startOf("day").toSQL({ includeOffset: false }) // "YYYY-MM-DD HH:mm:ss"

    for (const data of schedule_list) {
      try {
        const regStr = String(data.id_paciente ?? "").replace(/[^0-9]/g, "")
        if (!regStr) continue

        //Pega somente o primeiro nome
        const firstName = String(data.nome ?? "").trim().split(/\s+/)[0] || ""
        const firstNameDoctor = String(data.medico ?? "").trim().split(/\s+/)[0] || ""

        const shipping = new Shippingcampaign()
        shipping.interaction_id = 1
        shipping.interaction_seq = 1
        shipping.reg = parseInt(regStr, 10)

        shipping.dateshedule = data.datahora
        shipping.idexternal = data.id_marcacao

        shipping.name = String(data.nome ?? "").trim()
        shipping.cellphone = String(data.celular ?? "").replace(/[^0-9]+/g, "")

        const normalizedPhone = await ValidatePhone(shipping.cellphone)
        shipping.phonevalid = normalizedPhone ? true : null

        shipping.messagesent = false
        shipping.message = await greeting(String(`{greeting} {presentation} {askschedule}`), data)
        shipping.otherfields = String(await otherFields(data))

        shipping.doctor = String(data.medico ?? "").trim()
        shipping.unit = String(data.unidade ?? "").trim()

        shipping.covenant = ""
        shipping.idexternal_array = String(data.idexternal_array ?? "")

        // ✅ exatamente: ["JOSE","13/01/2026 10:00","NEO - ...","Dr. ANA"]
        const gupParamsArr = [
          firstName,
          formatKlingoDate(data.datahora),
          shipping.unit,
          firstNameDoctor,
        ]
        shipping.gupshupParams = JSON.stringify(gupParamsArr)

        const verifyExist = await Shippingcampaign.query()
          .where("reg", shipping.reg)
          .andWhere("dateshedule", data.datahora)
          .andWhere("created_at", ">=", date_start as any) // ajuste se seu driver exigir DateTime/Date
          .first()

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
    const date_start = DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm");
    const date_end = DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm");

    try {

      const confirmCancel = await Chat.query()
        .preload('shippingcamapgn', (query) => {
          query.select('idexternal_array')
        })
        .whereBetween('created_at', [date_start, date_end])
        .andWhere('externalstatus', 'A')
        .andWhere('interaction_id', 1);

      if (!confirmCancel || confirmCancel.length === 0) return;

      // Função para processar confirmação ou cancelamento
      const processSchedule = async (idExternal, status, message) => {
        for (const id of idExternal) {
          const result = await confirmOrCancelScheduleApi(id, status, message);
          if (!result) {
            console.error(`659569 - Falha ao processar ${message} para ID:`, id);
          }
        }
        return true;
      };

      for (const data of confirmCancel) {
        const idExternal = await returnIdExternal(data);
        if (!idExternal || idExternal.length === 0) {
          continue;
        }
        //console.log("Executando Confirmação e Cancelamento no Klingo", data.name);
        if (data.absoluteresp === 1) {
          // Faz a confirmação - STATUS C
          await processSchedule(idExternal, 'C', 'Confirmado pelo EasyTalk');
        } else if (data.absoluteresp === 2) {
          // Faz o cancelamento - STATUS N
          await processSchedule(idExternal, 'N', 'Não Confirmada pelo EasyTalk');
        } else {
          //console.warn(`Resposta absoluta inválida para o registro:${data.id}`, data.id);
          await Log.create({ name: 'DataSourceApiController', message: error, description: `Resposta absoluta inválida para o registro:${data.id}` })
        }

        // Atualiza o status externo após o processamento
        await Chat.query().where("id", data.id).update({ externalstatus: 'B' });
        //console.log(`Status externo atualizado para registro ID: ${data.id}`);
      }
    } catch (error) {
      console.error("14778 - Erro ao processar confirmações ou cancelamentos:", error);
    }
  }



  //RESETA PHONEVALID PARA NULL


  /****************************************************************** */
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


