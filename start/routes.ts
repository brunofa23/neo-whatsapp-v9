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
  //const result = Database.connection('mssql').from('teste').select('*')
  //console.log("entrei aqui", await Database.connection('mssql').from('pac').select('*'))
  return (await Database.connection('mssql').from('pac').select('*').where('pac_reg', '=', '15'))
})


Route.get('/mysql', async () => {
  return Database.connection('mysql').from('emp').select('*')

})

