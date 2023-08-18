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
        this.schema.createTable(this.tableName, (table) => {
            table.string('id').primary().notNullable();
            table.string('name');
            table.string('valuetext');
            table.boolean('valuebool').defaultTo('false');
            table.integer('valueinteger');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1691803114729_configs.js.map