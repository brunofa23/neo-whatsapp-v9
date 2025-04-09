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
const fs = require('fs')

test('display welcome page', async ({ client }) => {

  console.log('*******TESTES')
  // const answer = await interpretAnswer("nao 2 confirmar")
  //   console.log("::::::", answer)
  try {
    //const modelPath = path.resolve(__dirname, '../../nlp/model.nlp')
    const modelPath = 
    const teste = fs.existsSync(modelPath)
    console.log("::::::", teste)
  } catch (error) {
    console.log("ERRO:", error)
  }
})
