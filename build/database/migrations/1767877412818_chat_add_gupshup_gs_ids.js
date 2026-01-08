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
            table.string('gupshup_gs_id', 100).nullable().index().after('shippingcampaigns_id');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('gupshup_gs_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1767877412818_chat_add_gupshup_gs_ids.js.map