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
            table.string('message', 600).alter();
            table.string('otherfields', 600).alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('message').alter();
            table.string('otherfields').alter();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1704827626132_shippingcampaign_alter_message_otherfields.js.map