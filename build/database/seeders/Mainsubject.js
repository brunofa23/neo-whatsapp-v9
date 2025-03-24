"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Mainsubject_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Mainsubject"));
class default_1 extends Seeder_1.default {
    async run() {
        await Mainsubject_1.default.createMany([
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
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Mainsubject.js.map