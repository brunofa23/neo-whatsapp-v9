
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'
import { responderPergunta } from 'App/Services/Ai/aiResponder'


test('display welcome page', async ({ client }) => {


const response = await responderPergunta("Pode confirmar meu horário dia 20/09",
  `Gostaria de saber o endereço  da clínica neo visão do bairro Santa Efigenia obrigada`);
 console.log(response)

})
