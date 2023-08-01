import Server from '@ioc:Adonis/Core/Server'

import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'

Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),

])

console.log("***CHAT BOT V-20***")
executeWhatsapp()

Server.middleware.registerNamed({
})
