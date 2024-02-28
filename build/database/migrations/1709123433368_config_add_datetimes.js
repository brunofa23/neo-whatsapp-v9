"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'configs';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.datetime('valuedatetime');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('valuedatetime');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1709123433368_config_add_datetimes.js.map