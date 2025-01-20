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
            table.integer('company_id').nullable();
            table.string('obs').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumns(['company_id', 'obs']);
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1723030796958_agents_add_company_obs.js.map