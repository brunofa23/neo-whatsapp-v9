import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Config from 'App/Models/Config';

export default class extends BaseSeeder {
  public async run() {
    await Config.createMany([
      { id: 'executingSendMessage', name: 'verifica se está rodando SendMessage', valuebool: false },
    ]);
  }
}
