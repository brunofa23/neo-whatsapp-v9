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
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary().notNullable();
            table.integer('chats_id').notNullable().unsigned().references('chats.id');
            table.integer('idexternal');
            table.integer('reg').notNullable();
            table.string('cellphone').notNullable();
            table.string('cellphoneserialized').nullable();
            table.string('message', 600);
            table.string('response', 600);
            table.integer('returned');
            table.string('chatname');
            table.boolean('messagesent').defaultTo('false');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1706288944441_customchats.js.map