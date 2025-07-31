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
            table.string('doctor', 80);
            table.string('unit', 80);
            table.string('attendant', 80);
            table.string('covenant', 80);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('doctor');
            table.dropColumn('unit');
            table.dropColumn('attendant');
            table.dropColumn('covenant');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1712343183507_shippingcampaign_add_medic_unit_attendant_covenants.js.map