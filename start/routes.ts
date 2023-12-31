import Route from '@ioc:Adonis/Core/Route'
import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'
//import { sendRepeatedMessage } from '../app/Services/whatsapp-web/SendRepeatedMessage'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController'

console.log("***CHAT BOT V-88***21/12/2023")
console.log(`***NOME DO CLIENTE: ${process.env.CHAT_NAME}***`)
executeWhatsapp()
//sendRepeatedMessage()

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  Route.get('/teste', async () => {
    console.log("entrei no whatsapp router")
    //await executeWhatsapp()
    return "Executei a chamada da api do whatsapp"
  })

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




