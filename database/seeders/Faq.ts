import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Faq from 'App/Models/Faq'
export default class extends BaseSeeder {
  public async run() {
    // Write your database queries inside the run method
    await Faq.createMany([
      {

        ask: "Quais são os horários de atendimento?",
        answer: "Atendemos de segunda a sexta, das 8h às 18h.",
        behavior: `Você é uma atendente de call center de um Hospital.
        Responda de forma clara, objetiva e educada.
        Se não souber, diga: "Desculpe, não encontrei essa informação."
        Sempre em português.`
      },
      {
        ask: "Como faço para agendar um horário?",
        answer: "Você pode ligar direto no número 31-3235-0003",
        behavior: `Você é uma atendente de call center de um Hospital.
        Responda de forma clara, objetiva e educada.
        Se não souber, diga: "Desculpe, não encontrei essa informação."
        Sempre em português.`
      },
      {
        ask: "Qual o endereço da clinica/hospital/consultório?",
        answer: "estamos localizados...",
        behavior: `Você é uma atendente de call center de um Hospital.
        Responda de forma clara, objetiva e educada.
        Se não souber, diga: "Desculpe, não encontrei essa informação."
        Sempre em português.`
      },

    ])
  }
}
