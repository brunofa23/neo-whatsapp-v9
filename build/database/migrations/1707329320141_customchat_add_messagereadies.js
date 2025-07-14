"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'customchats';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('read');
            table.boolean('viewed');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('read');
            table.boolean('viewed');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1707329320141_customchat_add_messagereadies.js.map