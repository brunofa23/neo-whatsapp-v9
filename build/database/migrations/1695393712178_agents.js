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
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary().notNullable();
            table.string('name').notNullable();
            table.string('number_phone');
            table.integer('interval_init_query').notNullable();
            table.integer('interval_final_query').notNullable();
            table.integer('interval_init_message').notNullable();
            table.integer('interval_final_message').notNullable();
            table.integer('max_limit_message').notNullable();
            table.string('status');
            table.boolean('active').defaultTo('true');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1695393712178_agents.js.map