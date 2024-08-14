import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Response from 'App/Models/Response'

export default class extends BaseSeeder {
  public async run () {
    // Write your database queries inside the run method
    await Response.createMany([
      {
        name:'Comprimentos',
        message:'Olá!😀',
        local:'greeting',
      },
      {
        name:'Comprimentos',
        message:'Oi tudo bem?😀',
        local:'greeting',
      },
      {
        name:'Comprimentos',
        message:'Saudações!😀',
        local:'greeting',
      },
      {
        name:'Comprimentos',
        message:'Oi como vai?😀',
        local:'greeting',
      },
      {
        name:'Apresentação',
        message:'Eu me chamo Iris',
        local:'presentation',
      },
      {
        name:'Apresentação',
        message:'Eu sou a Iris',
        local:'presentation',
      },
      {
        name:'Apresentação',
        message:'Aqui é a Iris',
        local:'presentation',
      },
      {
        name:'Apresentação',
        message:'Aqui é a Iris',
        local:'presentation',
      }
    ])
  }
}
