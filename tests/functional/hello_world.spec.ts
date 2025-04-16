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

test('display welcome page', async ({ client }) => {
  try {
    const teste = await extractCellphone('')
    console.log('*******TESTES', teste)

  } catch (error) {
    console.error('Erro no teste:', error)
  }


})
