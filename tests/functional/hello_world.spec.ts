import Database from '@ioc:Adonis/Lucid/Database'
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
// import { responderPergunta } from 'App/Services/Ai/aiResponder'
// import fs from 'fs'
// import path from 'path'
// import Chat from 'App/Models/Chat'
// import Shippingcampaign from 'App/Models/Shippingcampaign'
import { chunckPhone, extractCellphone } from 'App/Services/whatsapp-web/util'
// import { NlpManager } from 'node-nlp'
// import { responderPergunta } from 'App/Services/Ai/aiResponder'
// import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'
// import Application from '@ioc:Adonis/Core/Application'
// const fs = require('fs')
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import Agent from 'App/Models/Agent'
import Shippingcampaign from 'App/Models/Shippingcampaign'

test('display welcome page', async ({ client }) => {


  const teste = await Shippingcampaign.create({interaction_id:1, interaction_seq:1, idexternal:1111, reg:123456, name:'Maria Conceição', cellphone:'3188888', message:"Até ção, bão"})
  console.log(teste)


})
