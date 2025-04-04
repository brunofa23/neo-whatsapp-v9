import Application from '@ioc:Adonis/Core/Application'

console.log(Application.nodeEnvironment)

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
test('display welcome page', async ({ client }) => {

  console.log('*******TESTES')

  const id = "553185228619@c.us";
  const match = id.match(/(\d{8})@c\.us$/); // Captura os últimos 8 números antes do "@c.us"
  const cellphone = match ? match[1] : "";
  console.log(cellphone); // "228619"

  const query =await Shippingcampaign.query()
  .where('cellphone','like', `%${await chunckPhone(id)}%`)
  .where('interaction_id',1).select('otherfields')

  const context = query.map((item)=> item.otherfields).join("\n")

 console.log(">>>>>>", context)

  //const resposta = await responderPergunta('Qual o endereço da Clinica e a data da consulta?',`{"address":"AV TITO FULGENCIO, 1000, CID. INDUSTRIAL","medic":"FILA TOPOGRAFIA","schedule":"2023-12-26 07:30"}`)
  const resposta = await
  responderPergunta('marcar consulta', context)
  console.log(">>>>>>RESPOSTA:", resposta)




})
