
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'
import { responderPergunta } from 'App/Services/Ai/aiResponder'


test('display welcome page', async ({ client }) => {

const dateStr = "2025-10-12"

const today = DateTime.fromISO(dateStr, { zone: "America/Sao_Paulo" })
console.log(">>>>>",today)

//let today = DateTime.local().setZone('America/Sao_Paulo')

  let daysToAdd = null

  if (today.weekday >= 1 && today.weekday <= 4) {
    // Segunda a Quinta → +2
    daysToAdd = 2
  } else if (today.weekday === 5) {
    // Sexta → +3 (segunda)
    daysToAdd = 3
  } else if (today.weekday === 6) {
    console.log("!!!!!!")
    // Sábado → +2 (terça)
    daysToAdd = 3
  } else if (today.weekday === 7) {
    // Domingo → não envia
    return
  }

  const date = today.plus({ days: daysToAdd }).toFormat("yyyy-MM-dd")

  console.log(date)








})
