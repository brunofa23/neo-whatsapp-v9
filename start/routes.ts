import Route from '@ioc:Adonis/Core/Route'

import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'

console.log("***CHAT BOT V-65***")
console.log(`***NOME DO CLIENTE: ${process.env.CHAT_NAME}***`)
executeWhatsapp()

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {
  Route.get('/teste', async () => {
    await executeWhatsapp()
  })
  Route.post('/restart', 'ShippingcampaignsController.resetWhatsapp')
  Route.post('/logout', 'ShippingcampaignsController.logout')

  Route.post('/chat', 'ShippingcampaignsController.chat')
  Route.get('/maxlimitsendmessage', 'ShippingcampaignsController.maxLimitSendMessage')
  Route.get('/datasources', 'DatasourcesController.DataSource')
  Route.get('/dayposition', 'ShippingcampaignsController.dayPosition')

  Route.get('/confirmschedule', 'DatasourcesController.confirmSchedule')

}).prefix('/api')




