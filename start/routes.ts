import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'
import Route from '@ioc:Adonis/Core/Route'

console.log("***CHAT BOT V-26***")
executeWhatsapp()

Route.get('/', async () => {
  return { hello: 'world - v39' }
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




