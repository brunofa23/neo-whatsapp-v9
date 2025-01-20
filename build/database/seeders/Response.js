"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
class default_1 extends Seeder_1.default {
    async run() {
        await Response_1.default.createMany([
            {
                name: 'Comprimentos',
                message: 'Olá!😀',
                local: 'greeting',
            },
            {
                name: 'Comprimentos',
                message: 'Oi tudo bem?😀',
                local: 'greeting',
            },
            {
                name: 'Comprimentos',
                message: 'Saudações!😀',
                local: 'greeting',
            },
            {
                name: 'Comprimentos',
                message: 'Oi como vai?😀',
                local: 'greeting',
            },
            {
                name: 'Apresentação',
                message: 'Eu me chamo Iris',
                local: 'presentation',
            },
            {
                name: 'Apresentação',
                message: 'Eu sou a Iris',
                local: 'presentation',
            },
            {
                name: 'Apresentação',
                message: 'Aqui é a Iris',
                local: 'presentation',
            },
            {
                name: 'Apresentação',
                message: 'Aqui é a Iris',
                local: 'presentation',
            }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Response.js.map