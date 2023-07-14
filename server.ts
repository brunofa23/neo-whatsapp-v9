import { Ignitor } from '@adonisjs/core/build/standalone'
import sourceMapSupport from 'source-map-support'
import 'reflect-metadata';

require('../neo-whatsapp-v9/app/Services/whatsapp-web/whatsapp.ts')

sourceMapSupport.install({ handleUncaughtExceptions: false })

new Ignitor(__dirname)
  .httpServer()
  .start()
