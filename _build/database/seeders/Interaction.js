"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Seeder_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Seeder"));
class default_1 extends Seeder_1.default {
    async run() {
        await Database_1.default.table('interactions').insert([
            { id: '1', seq: '1', name: 'Confirmação de Agenda' }
        ]);
    }
}
exports.default = default_1;
//# sourceMappingURL=Interaction.js.map