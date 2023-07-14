import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
//const database = require('config/database')
export default class TestesController {

  public async teste({ auth, request, params, response }: HttpContextContract) {
    return "teste1"

    const teste1 = await Database.connection('mssql').from('pac').select('*').where('pac_reg', '=', '15')
    console.log("teste 1", teste1)

  }


}


