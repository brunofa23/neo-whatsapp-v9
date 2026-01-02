"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'interactions';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('id_templates_gupshup', 100).after('querydev').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('id_templates_gupshup');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1767042175011_interactions_add_id_templates.js.map