import { test } from '@japa/runner'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Unit from 'App/Models/Unit'
import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'
import Agent from 'App/Models/Agent'
import Response from 'App/Models/Response'
import { startAgent, getWhatsAppClient, destroyAgent } from "App/Services/whatsapp-web/whatsappConnection"

test('display welcome page', async ({ client }) => {

  //chmamar a API DO KLINGO
  const agent = await Agent.query().where('id', 6).first()
  //console.log(agent)
  client = await startAgent(agent)


})
