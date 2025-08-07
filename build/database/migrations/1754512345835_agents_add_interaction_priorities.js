"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'agents';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('interaction_priority', 15).nullable().after('default_chat');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('interaction_priority');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1754512345835_agents_add_interaction_priorities.js.map