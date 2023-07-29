import Route from '@ioc:Adonis/Core/Route'
import Database from '@ioc:Adonis/Lucid/Database'

import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'

//import { sendRepeatedMessage } from '../app/Services/whatsapp-web/SendRepeatedMessage'

Route.get('/', async () => {
  return { hello: 'world - v24' }
})

Route.group(() => {
  Route.get('/teste', async () => {
    await executeWhatsapp()
  })
  Route.post('/restart', 'ShippingcampaignsController.resetWhatsapp')
  Route.post('/logout', 'ShippingcampaignsController.logout')

  Route.post('/chat', 'ShippingcampaignsController.chat')

}).prefix('/api')







Route.get('/mysql', async () => {
  return Database.connection('mysql').from('emp').select('*')

})

