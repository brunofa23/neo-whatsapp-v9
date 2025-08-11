
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
// import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
// import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
// import Config from 'App/Models/Config'
// import Chat from 'App/Models/Chat'
// import Manifest from 'App/Models/Manifest'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Agent from 'App/Models/Agent'
import Log from 'App/Models/Log'
test('display welcome page', async ({ client }) => {

  const now = DateTime.now()
  const yesterdayStart = now.minus({ days: 3 }).startOf('day')
  const yesterdayEnd = now.minus({ days: 1 }).endOf('day')
  const tomorrowStart = now.plus({ days: 1 }).startOf('day')
  const tomorrowEnd = now.plus({ days: 1 }).endOf('day')

  const query = Shippingcampaign.query()
    .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
    .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
    .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
    .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
    .andWhere('interaction_id',1)
    .whereNull('phonevalid')
    // .update({
    //   createdAt: DateTime.now().toSQL({ includeOffset: false })
    // })

  const data = await query
  if (data[0]>0)
    await Log.create({ name: "Resend", message: `Reenvio de mensagens, total:${data[0]}`, description: "Function: resendMessage" })
  console.log("data:",query.toQuery())



})
