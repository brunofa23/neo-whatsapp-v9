import Route from '@ioc:Adonis/Core/Route'
import Database from '@ioc:Adonis/Lucid/Database'



Route.get('/', async () => {
  return { hello: 'world' }
})

Route.get('/teste', async () => {

  return Database.connection('mssql').from('teste').select('*')
})


Route.get('/mysql', async () => {
  return Database.connection('mysql').from('emp').select('*')

})

