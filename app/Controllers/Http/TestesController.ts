import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

//const database = require('config/database')
export default class TestesController {

  const users = await Database.connection('mysql').table('emp')

}
