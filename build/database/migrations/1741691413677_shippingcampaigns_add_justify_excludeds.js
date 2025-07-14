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
            table.string('justify_excluded', 255).nullable().after('excluded');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('justify_excluded');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1741691413677_shippingcampaigns_add_justify_excludeds.js.map