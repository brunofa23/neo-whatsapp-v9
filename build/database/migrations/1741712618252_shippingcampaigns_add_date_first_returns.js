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
            table.datetime('date_first_return').nullable().after('justify_excluded');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('date_first_return');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1741712618252_shippingcampaigns_add_date_first_returns.js.map