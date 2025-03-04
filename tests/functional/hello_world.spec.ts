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

  const date_return = DateTime.now().toFormat("yyyy-MM-dd HH:mm")
  await Chat.query().where('id',117139).update({date_return})

})
