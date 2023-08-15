import Route from '@ioc:Adonis/Core/Route'

import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'

console.log("***CHAT BOT V-30***")
console.log(`***NOME DO CLIENTE: ${process.env.CHAT_NAME}***`)
executeWhatsapp()

Route.get('/', async () => {
  return { hello: 'world - v28' }
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

}).prefix('/api')




