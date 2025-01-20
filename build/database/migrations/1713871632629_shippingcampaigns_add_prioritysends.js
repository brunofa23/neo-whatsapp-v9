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
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('prioritysend');
            table.boolean('excluded');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('prioritysend');
            table.dropColumn('excluded');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1713871632629_shippingcampaigns_add_prioritysends.js.map