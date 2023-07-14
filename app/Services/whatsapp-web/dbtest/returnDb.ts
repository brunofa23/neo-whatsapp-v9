//import Database from '@ioc:Adonis/Lucid/Database'


async function numbersPhones() {

  const listPhones = await require('../dbtest/numbersPhones.json')
  //console.log("LISTA DE TELEFONES:::", listPhones)
  return listPhones

}

async function pacList() {
  //const result = await Database.connection('mssql').from('pac').select('*').where('pac_reg', '=', '15')
  //return result
}

module.exports = { numbersPhones, pacList }
