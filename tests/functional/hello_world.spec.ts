
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'


test('display welcome page', async ({ client }) => {

  const answer = await interpretAnswer("não não não não")
  //const answer = await interpretAnswer("Este contato não é do Dener")
  console.log("res:::::", answer)

})
