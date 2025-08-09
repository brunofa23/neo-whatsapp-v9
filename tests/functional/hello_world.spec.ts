
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
// import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
// import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
// import Config from 'App/Models/Config'
// import Chat from 'App/Models/Chat'
// import Manifest from 'App/Models/Manifest'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Agent from 'App/Models/Agent'
test('display welcome page', async ({ client }) => {


  const yesterday = DateTime.now().minus({ days: 1 })
  const tomorrow = DateTime.now().plus({ days: 1 })

  const patiensToSend = await Shippingcampaign.query().select('name', 'cellphone')
    .where('created_at', '>=', yesterday.startOf('day').toSQL())
    .where('created_at', '<=', yesterday.set({ hour: 23, minute: 0, second: 0 }).toSQL())
    .where('dateshedule', '>=', tomorrow.startOf('day').toSQL())
    .where('dateshedule', '<=', tomorrow.endOf('day').toSQL())
    .whereNull('phonevalid')
  // .update({
  //   createdAt: DateTime.now().toSQL({ includeOffset: false })
  // })


  const result = patiensToSend.map(p => ({
    name: p.name,
    cellphone: p.cellphone
  }))

  console.log(result)


})
