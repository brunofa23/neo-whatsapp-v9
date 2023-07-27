import { Ignitor } from '@adonisjs/core/build/standalone'
import sourceMapSupport from 'source-map-support'
import 'reflect-metadata';


sourceMapSupport.install({ handleUncaughtExceptions: false })

new Ignitor(__dirname)
  .httpServer()
  .start()
