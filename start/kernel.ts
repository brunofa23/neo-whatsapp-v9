import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'
import Server from '@ioc:Adonis/Core/Server'

Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),

])

console.log("***CHAT BOT V-16***")
executeWhatsapp()

Server.middleware.registerNamed({
})
