import Database from '@ioc:Adonis/Lucid/Database'
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'

export default class extends BaseSeeder {
  public async run() {
    await Database.table('interactions').insert([
      { id: '1', seq: '1', name: 'Confirmação de Agenda' }
    ])

  }
}
