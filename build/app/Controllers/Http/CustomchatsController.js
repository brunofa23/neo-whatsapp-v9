"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class CustomchatsController {
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        const query = Database_1.default.from('chats')
            .select('id', 'reg', 'cellphone', 'cellphoneserialized', 'message', 'response', 'invalidresponse', 'returned', 'chatname', Database_1.default.raw('0 messagesent'), 'chatnumber', Database_1.default.raw('0  phonevalid'), Database_1.default.raw('0 `read`'), Database_1.default.raw('0 viewed'), Database_1.default.raw('0 ack'), Database_1.default.raw('0 path_media'), Database_1.default.raw('created_at'))
            .where('id', params.id)
            .union(query => {
            query.from('customchats')
                .select('id', 'reg', 'cellphone', 'cellphoneserialized', 'message', 'response', 'response', 'returned', 'chatname', 'messagesent', 'chatnumber', 'phonevalid', 'read', 'viewed', 'ack', 'path_media', 'created_at')
                .where('chats_id', params.id);
        });
        const data = await query;
        return response.status(200).send(data);
    }
    async sendMessage({ auth, request, response }) {
        await auth.use('api').authenticate();
        const body = request.only(Customchat_1.default.fillable);
        body.messagesent = false;
        try {
            const payLoad = await Customchat_1.default.create(body);
            await Chat_1.default.query().where('id', body.chats_id).update({ last_response: 1 });
            return response.status(201).send(payLoad);
        }
        catch (error) {
            error;
        }
    }
    async viewedConfirmed({ auth, params, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await Customchat_1.default.query()
                .where('chats_id', params.chats_id)
                .update({ viewed: true });
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = CustomchatsController;
//# sourceMappingURL=CustomchatsController.js.map