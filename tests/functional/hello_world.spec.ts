import { test } from '@japa/runner'
// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
// import Shippingcampaign from 'App/Models/Shippingcampaign'
// import Chat from 'App/Models/Chat'
// import Unit from 'App/Models/Unit'
// import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
// import { ValidatePhone } from 'App/Services/whatsapp-web/util'
// import ResponsesController from './ResponsesController'
// import { DateTime } from 'luxon'
// import Response from 'App/Models/Response'
import { responderPergunta } from 'App/Services/Ai/aiResponder'
import fs from 'fs'
import path from 'path'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { chunckPhone } from 'App/Services/whatsapp-web/util'
import { NlpManager } from 'node-nlp'
import { responderPergunta } from 'App/Services/Ai/aiResponder'
import {interpretAnswer} from 'App/Services/whatsapp-web/IdentifyAnswer'

test('display welcome page', async ({ client }) => {

  console.log('*******TESTES')

  // const id = "553185228619@c.us";
  // const match = id.match(/(\d{8})@c\.us$/); // Captura os últimos 8 números antes do "@c.us"
  // const cellphone = match ? match[1] : "";
  const answer = await interpretAnswer("não sou bruno")
  console.log(">>>>>", answer)



})
