import Server from '@ioc:Adonis/Core/Server'

import { executeWhatsapp } from '../app/Services/whatsapp-web/whatsapp'

Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),

])

executeWhatsapp()

Server.middleware.registerNamed({
})
