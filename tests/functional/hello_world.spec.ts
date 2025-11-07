
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

test('display welcome page', async ({ client }) => {

  // const filePath = Application.makePath(`app/Medias/FilesToSend/ebookCatarata.pdf`)
  // console.log(">>>>>", filePath)

  //  try {
  //   await fs.promises.access(filePath, fs.constants.F_OK)
  //   //const teste = fs.existsSync(filePath)
  //   console.log('✅ O arquivo existe!')
  //   return true
  // } catch (err) {
  //   console.log('❌ O arquivo não existe.')
  //   return false
  // }

const shippingcampaignsController = new ShippingcampaignsController()

  const agent = await Agent.query().where('id', 472).first()
  //console.log(agent)
  if(agent){
    const shippingCampaign = await shippingcampaignsController.patientToSend(agent)
    console.log("!!!!retorno", shippingCampaign?.file_path)
    if(shippingCampaign?.file_path)
      console.log("EXISTE ARQUIVO PARA ENVIAR")

  }




})
