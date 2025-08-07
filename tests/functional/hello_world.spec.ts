
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

  const data = await Agent.query().whereNull('deleted').orWhere('deleted', false)
  console.log(data)

})
