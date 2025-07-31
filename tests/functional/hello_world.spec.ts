
import { test } from '@japa/runner'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import { DateTime } from 'luxon'
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import Config from 'App/Models/Config'
import Chat from 'App/Models/Chat'
import Manifest from 'App/Models/Manifest'

test('display welcome page', async ({ client }) => {


const query = Manifest.query()
        .where('chat_id', 7348)
        .first()

        const data = await query
        if(data?.mainsubject_id)
          await data.load('mainsubject')
        if(data?.chat_id)
          await data.load('chat')
        if(data?.user_responsible_id)
          await data.load('user')

    console.log("DATA::::", data)


})
