
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'


test('display welcome page', async ({ client }) => {

  const now = DateTime.now()
  const yesterdayStart = now.minus({ days: 1 }).startOf('day')
  const yesterdayEnd = now.minus({ days: 1 }).endOf('day')
  const tomorrowStart = now.plus({ days: 1 }).startOf('day')
  const tomorrowEnd = now.plus({ days: 1 }).endOf('day')


  const records = await Shippingcampaign.query()
    .where('created_at', '>=', '2025-08-01')
    .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
    .where('dateshedule', '>=', '2025-08-01')
    .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
    .andWhere('interaction_id', 2)
    .whereNull('phonevalid')
    .andWhere('messagesent', 0)
    .andWhereNull('excluded')
    .limit(40) // <-- limita a busca
    .select('id') // só traz os ids para performance


    console.log(">>>>",records)
  // pega apenas os ids
  const ids = records.map(r => r.id)
  console.log(">>>>",ids)

  if (ids.length > 0) {
    const query = Shippingcampaign.query()
      .whereIn('id', ids)
      .update({
        createdAt: DateTime.now().toSQL({ includeOffset: false })
      })

    console.log("!!!!!", query.toQuery())

  }

}



  //console.log(updatedResendConfirmation.toQuery())

})
