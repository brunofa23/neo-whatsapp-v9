"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class default_1 extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'manifests';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('chat_id').notNullable().unsigned().references('chats.id').onDelete('CASCADE').onUpdate('CASCADE');
            table.string('responsible', 30).nullable();
            table.string('main_subject', 30).nullable();
            table.string('report', 500).nullable();
            table.string('employee_involved').nullable();
            table.string('medic_einvolved').nullable();
            table.dateTime('date_limit').nullable();
            table.string('responsible_response', 30).nullable();
            table.string('root_cause', 350).nullable();
            table.string('action', 350).nullable();
            table.dateTime('date_limit_action').nullable();
            table.dateTime('date_limit_manifest').nullable();
            table.string('obs').nullable();
            table.string('status', 10).nullable();
            table.timestamp('created_at', { useTz: true });
            table.timestamp('updated_at', { useTz: true });
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = default_1;
//# sourceMappingURL=1740076425802_manifests.js.map