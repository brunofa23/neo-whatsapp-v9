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
            table.string('phone_unit');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('phone_unit');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1723494893546_shippingcampaigns_add_phone_units.js.map