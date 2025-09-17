"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
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