
import { test } from '@japa/runner'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import { DateTime } from 'luxon'
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import Config from 'App/Models/Config'
import Chat from 'App/Models/Chat'

test('display welcome page', async ({ client }) => {
  const data = await Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', '5516991474606@c.us')
    .andWhere('chatnumber', '553198849340').first()
    //.andWhere('returned', false).first()
    //.whereNull('response').first()

  console.log(data?.$preloaded.shippingcampaign)


})
