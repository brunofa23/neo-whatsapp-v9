import { test } from '@japa/runner'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Unit from 'App/Models/Unit'
import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'

test('display welcome page', async ({ client }) => {

  //chmamar a API DO KLINGO
  const date_start = DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm")
  const date_end = DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm")
  try {
    const confirmCancel = await Chat.query()
    .preload('shippingcamapgn')
      .whereBetween('created_at', [date_start, date_end])
      .andWhere('externalstatus', 'A')
      .andWhere('interaction_id', 1)

      console.log("Executando Confirmação e Cancelamento no Klingo", confirmCancel[0].shippingcamapgn)
return


    if (!confirmCancel || confirmCancel.length === 0) return
    let result
    for (const data of confirmCancel) {
      console.log("Executando Confirmação e Cancelamento no Klingo")
      if (data.absoluteresp === 1) {
        //   //FAZ A CONFIRMAÇÃO - STATUS C
        //console.log("EXECUTAR CONFIRMAÇÃO", data.idexternal, data.idexternal_array)
        //   result = await confirmOrCancelScheduleApi(data.idexternal, 'C', 'Confirmado')
      } else if (data.absoluteresp === 2) {
        //   //FAZ O CANCELAMENTO - STATUS N
        //console.log("EXECUTAR CANCELAMENTO", data.idexternal, data.idexternal_array)
        //   result = await confirmOrCancelScheduleApi(data.idexternal, 'N', 'Não Confirmada')
      }
      // if (result)
      //   await Chat.query().where("id", data.id).update({ externalstatus: 'B' })
    }

  } catch (error) {
    console.error("Erro ao processar confirmações ou cancelamentos:", error);
  }






})
