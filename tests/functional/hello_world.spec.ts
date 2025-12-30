
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'
import { responderPergunta } from 'App/Services/Ai/aiResponder'
import Interaction from 'App/Models/Interaction'
import ResponsesController from 'App/Controllers/Http/ResponsesController'
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign new"
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController'
import Agent from 'App/Models/Agent'
import SendFromQueueGupshup from 'App/Services/whatsapp-gupshup/SendFromQueueGupshup'

test('display welcome page', async ({ client }) => {

const agent = await Agent.findOrFail(588)
//console.log(agent)
await SendFromQueueGupshup(agent)


})
