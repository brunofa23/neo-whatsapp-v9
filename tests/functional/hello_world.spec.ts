import { test } from '@japa/runner'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Unit from 'App/Models/Unit'
import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'
import Response from 'App/Models/Response'

test('display welcome page', async ({ client }) => {

  let date = DateTime.now().plus({ days: 3 });
  // Se a data cair no sábado (6) ou domingo (7), ajustar para segunda-feira
  if (date.weekday === 6) {
    date = date.plus({ days: 2 }); // Passa para segunda-feira
} else if (date.weekday === 7) {
    date = date.plus({ days: 1 }); // Passa para segunda-feira
}
  date = date.toFormat("yyyy-MM-dd");

  console.log("Date:",date)

})
