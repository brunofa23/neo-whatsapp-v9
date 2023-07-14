import Database from '@ioc:Adonis/Lucid/Database'
//const database = require('config/database')


async function teste() {
  //return "teste1"

  const teste = await Database.connection('mssql').from('pac').select('*').where('pac_reg', '=', '15')
  console.log("teste 1", teste)

}

module.exports = { teste }





