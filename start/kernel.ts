import Server from '@ioc:Adonis/Core/Server'

import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'

Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),

])

Server.middleware.registerNamed({
})

console.log("***CHAT BOT V-25***")
executeWhatsapp()
