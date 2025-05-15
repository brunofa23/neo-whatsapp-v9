import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Mainsubject from 'App/Models/Mainsubject'

export default class extends BaseSeeder {
  public async run() {
    // Write your database queries inside the run method
    await Mainsubject.createMany([
      {
        id: 1,
        description: "Agendamento",
      },
      {
        id: 2,
        description: "Atendimento Exames",
      },
      {
        id: 3,
        description: "Atendimento Médico",
      },
      {
        id: 4,
        description: "Atendimento Portaria",
      },
      {
        id: 5,
        description: "Atendimento Rec.",
      },
      {
        id: 6,
        description: "Cobrança",
      },
      {
        id: 7,
        description: "Contato",
      },
      {
        id: 8,
        description: "Higiene e Limpeza",
      },
      {
        id: 9,
        description: "Informação",
      },
      {
        id: 10,
        description: "Postura de Funcionários",
      },
      {
        id: 11,
        description: "Tempo de Espera",
      },
      {
        id: 12,
        description: "Atendimento Bloco Cirúrgico",
      },
      {
        id: 13,
        description: "Outros (Especificar no Complemento)",
      },

    ])
  }
}



