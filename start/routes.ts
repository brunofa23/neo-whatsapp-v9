import Route from '@ioc:Adonis/Core/Route'
//import { sendRepeatedMessage } from '../app/Services/whatsapp-web/SendRepeatedMessage'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController'

import { startAgent } from '../app/Services/whatsapp-web/whatsappConnection'

console.log("***CHAT BOT V-88***21/12/2023")
console.log(`***NOME DO CLIENTE: ${process.env.CHAT_NAME}***`)

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  // Route.get('/teste', async () => {
  //   console.log("entrei no whatsapp router")
  //   //await executeWhatsapp()
  //   const state = await stateAgent()
  //   console.log("esse é o estado do cliente>>>", state)
  //   return "Executei a chamada da api do whatsapp"
  // })

  // Route.get('/connection/:id', async ({ params, request }) => {
  //   console.log("entrei no whatsapp router", params)
  //   console.log("REQUEST>>", request.body())

  //   await startAgent(params.id)
  //   return "Executei a chamada da api do whatsapp"
  // })

  // Route.get('/status/:id', async ({ params }) => {
  //   console.log("entrei no whatsapp router", params)
  //   await statusAgent(params.id)
  //   return "Executei a chamada da api do whatsapp"
  // })

  Route.get("/agents", "AgentsController.index")
  Route.post("/agents", "AgentsController.store")
  Route.post("/agents/connection/:id", "AgentsController.connection")
  Route.patch("/agents/:id", "AgentsController.update")


  Route.get("/smart", "DatasourcesController.scheduledPatients")


  Route.post('/restart', 'ShippingcampaignsController.resetWhatsapp')
  Route.post('/logout', 'ShippingcampaignsController.logout')

  Route.post('/chat', 'ShippingcampaignsController.chat')
  Route.get('/maxlimitsendmessage', 'ShippingcampaignsController.maxLimitSendMessage')
  Route.get('/datasources', 'DatasourcesController.DataSource')
  Route.get('/dayposition', 'ShippingcampaignsController.dayPosition')
  Route.get('/dateposition', 'ShippingcampaignsController.datePosition')
  Route.get('/datepositionsynthetic', 'ShippingcampaignsController.datePositionSynthetic')
  Route.get('/listshippingcampaigns', 'ShippingcampaignsController.listShippingCampaigns')
  Route.get('/serviceevaluationdashboard', 'ShippingcampaignsController.serviceEvaluationDashboard')

  Route.get('/confirmschedule', 'DatasourcesController.confirmSchedule')
  Route.get('/serviceevaluation', 'DatasourcesController.serviceEvaluation')

}).prefix('/api')




