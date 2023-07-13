import Route from '@ioc:Adonis/Core/Route'
import Database from '@ioc:Adonis/Lucid/Database'

import { logout } from 'App/Services/whatsapp-web/SendRepeatedMessage'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.get('/logout', async () => {

  const _logout = logout()
  return { hello: 'world', _logout }
})

Route.get('/teste', async () => {
  const result = Database.connection('mssql').from('teste').select('*')
  console.log("entrei aqui", await Database.connection('mssql').from('teste').select('*'))
  return Database.connection('mssql').from('teste').select('*')
})


Route.get('/mysql', async () => {
  return Database.connection('mysql').from('emp').select('*')

})

