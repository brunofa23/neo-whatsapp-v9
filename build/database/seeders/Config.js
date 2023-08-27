"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
class default_1 extends Seeder_1.default {
    async run() {
        await Config_1.default.createMany([
            { id: 'executingSendMessage', name: 'verifica se está rodando SendMessage', valuebool: false },
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Config.js.map