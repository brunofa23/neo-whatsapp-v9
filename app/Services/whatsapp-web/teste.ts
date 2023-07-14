import Database from "@ioc:Adonis/Lucid/Database";
async function listPac() {
  return await Database.connection('mssql').from('pac').select('*').where('pac_reg', '=', '15')
}

module.exports = { listPac }
