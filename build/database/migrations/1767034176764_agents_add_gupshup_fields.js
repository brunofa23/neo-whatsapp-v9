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
            table.string('gupshup_source', 20).nullable().after('provider_type');
            table.string('gupshup_src_name', 100).nullable().after('gupshup_source');
            table.string('gupshup_template_id', 60).nullable().after('gupshup_src_name');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('gupshup_source');
            table.dropColumn('gupshup_src_name');
            table.dropColumn('gupshup_template_id');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1767034176764_agents_add_gupshup_fields.js.map