"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const luxon_1 = require("luxon");
class ChatsController {
    async index({ auth, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await Chat_1.default.query();
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async sentMessages({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { initialdate, finaldate, interaction_id, reg, name, cellphone } = request.only([
            'initialdate',
            'finaldate',
            'interaction_id',
            'reg',
            'name',
            'cellphone',
        ]);
        const initial = luxon_1.DateTime.fromISO(initialdate, { zone: 'America/Sao_Paulo' }).startOf('day');
        const final = luxon_1.DateTime.fromISO(finaldate, { zone: 'America/Sao_Paulo' }).endOf('day');
        if (!initial.isValid || !final.isValid) {
            return response.status(400).send({ message: 'Datas inválidas.' });
        }
        try {
            const query = Database_1.default.connection(Env_1.default.get('DB_CONNECTION_MAIN'))
                .from('chats')
                .select('interaction_id', 'reg', 'name', 'cellphone', 'created_at', 'ack', 'returned')
                .whereBetween('created_at', [
                initial.toSQL({ includeOffset: false }),
                final.toSQL({ includeOffset: false }),
            ])
                .orderBy('created_at', 'desc');
            if (interaction_id) {
                query.where('interaction_id', interaction_id);
            }
            if (reg) {
                query.where('reg', reg);
            }
            if (name) {
                query.where('name', 'like', `%${name}%`);
            }
            if (cellphone) {
                query.where('cellphone', 'like', `%${cellphone}%`);
            }
            const data = await query;
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await Chat_1.default.query().where('id', params.id).first();
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        const body = request.only(Chat_1.default.fillable);
        try {
            const data = await Chat_1.default.query().where('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async closed({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { start_date, end_date } = request.only(['start_date', 'end_date']);
        try {
            const data = await Chat_1.default.query()
                .where('created_at', '>=', start_date)
                .andWhere('created_at', '<=', end_date)
                .update({ closed: true });
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = ChatsController;
//# sourceMappingURL=ChatsController.js.map