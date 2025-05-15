"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Faq_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Faq"));
class default_1 extends Seeder_1.default {
    async run() {
        await Faq_1.default.createMany([
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
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Faq.js.map