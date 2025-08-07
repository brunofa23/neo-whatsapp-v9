
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

  const agentCompany = await Agent.query().where('id', 426).first()
  const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
  const query = Shippingcampaign.query()
    .whereNull('phonevalid')
    .andWhere('messagesent', 0)
    .andWhere('created_at', '>', yesterday)

  if (agentCompany?.company_id) {
    query.andWhere('company_id', agentCompany?.company_id)
  }
  else query.whereNull('company_id')

  query.whereNotExists((subquery) => {
    subquery.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
  })

    //fazer um if bem aqui
    .orderByRaw('interaction_id,RAND()').limit(10)

  console.log(">>>>", query.toQuery())
  //.orderBy('prioritysend', "desc").orderBy('dateshedule').orderByRaw('RAND()').limit(5)
  //const shippingCampaign = await query.first()

})
