"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'templates';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.text('params_schema').nullable().after('description');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('params_schema');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1772471188660_templates_add_params_schemas.js.map