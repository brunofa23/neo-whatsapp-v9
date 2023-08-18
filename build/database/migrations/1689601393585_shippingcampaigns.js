"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'shippingcampaigns';
    }
    static get connection() {
        return 'mssql2';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary().notNullable();
            table.integer('interaction_id').notNullable().references('interactions.id');
            table.integer('interaction_seq');
            table.integer('idexternal');
            table.integer('reg').notNullable();
            table.string('name').notNullable();
            table.string('cellphone');
            table.string('cellphoneserialized');
            table.string('message', 350);
            table.string('otherfields', 400);
            table.boolean('phonevalid');
            table.boolean('messagesent');
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
            table.index('cellphone');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1689601393585_shippingcampaigns.js.map