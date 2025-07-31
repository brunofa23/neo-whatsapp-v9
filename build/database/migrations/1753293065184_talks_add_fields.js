"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'talks';
    }
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('chat_id').nullable().unsigned().references('chats.id').after('id');
            table.integer('reg', 11).nullable().after('chat_id');
            table.string('cellphoneserialized', 30).nullable().after('cellphone');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('chat_id');
            table.dropColumn('reg');
            table.dropColumn('cellphoneserialized');
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=1753293065184_talks_add_fields.js.map