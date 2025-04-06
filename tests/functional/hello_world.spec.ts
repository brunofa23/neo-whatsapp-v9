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

  const chunckPhoneNumber = await chunckPhone('31985228619@')

   const query1 = Shippingcampaign.query()
        .where('cellphone', 'like', `%${await chunckPhone('31985228619')}%`)
        .where('interaction_id', 1)
        //.select('otherfields','name');

        console.log("::::::", chunckPhoneNumber)
        console.log("::::::", query1.toQuery())

        const query = await query1

    const context = query.map((item) => `name:${item.name} \n${item.otherfields}` ).join("\n");
    //const context = query.map(item =>item.serialize());
    console.log("::::::", context)

})
