"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'chats';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('absoluteresp');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('absoluteresp');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1692380240324_chats_add_absoluteresp.js.map