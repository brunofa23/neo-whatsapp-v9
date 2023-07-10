import Route from '@ioc:Adonis/Core/Route'
import Database from '@ioc:Adonis/Lucid/Database'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.get('/teste', async () => {
  //return "tester"
  console.log(Database.from('teste').select('*').toSQL())
  return Database.from('teste').select('*')
  //return Database.from('posts').select('*')
})

