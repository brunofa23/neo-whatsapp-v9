"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const luxon_1 = require("luxon");
const WhatsAppClientManager_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/WhatsAppClientManager"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
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
        const rawBody = request.only(Customchat_1.default.fillable);
        if (!rawBody.id || !rawBody.cellphoneserialized || !rawBody.message) {
            return response.badRequest({ error: 'Campos obrigatórios ausentes (id, message ou cellphoneserialized).' });
        }
        const formattedBody = {
            ...rawBody,
            messagesent: false,
            chats_id: rawBody.id,
        };
        delete formattedBody.returned;
        delete formattedBody.created_at;
        delete formattedBody.id;
        delete formattedBody.response;
        try {
            const agent = await Agent_1.default.query().where('default_chat', true).firstOrFail();
            const client = WhatsAppClientManager_1.default.getClient(String(agent.id));
            if (!client) {
                return response.status(500).send({ error: 'Cliente WhatsApp não encontrado para o agente.' });
            }
            await client.sendMessage(formattedBody.cellphoneserialized, formattedBody.message);
            const payLoad = await Customchat_1.default.create({
                ...formattedBody,
                chatnumber: agent.number_phone,
            });
            console.log(">>>>", client.info.wid._serialized);
            await Talk_1.default.create({
                chat_id: formattedBody.chats_id,
                reg: formattedBody.reg,
                cellphone: formattedBody.cellphoneserialized,
                message: formattedBody.message,
                chatnumber: client.info.wid._serialized,
                type: 'to',
            });
            await Chat_1.default.query().where('id', formattedBody.chats_id).update({ last_response: 1 });
            const chat = await Chat_1.default.find(formattedBody.chats_id);
            if (chat?.shippingcampaigns_id) {
                const shippingcampaign = await Shippingcampaign_1.default.find(chat.shippingcampaigns_id);
                if (shippingcampaign && !shippingcampaign.date_first_return) {
                    shippingcampaign.date_first_return = luxon_1.DateTime.local().toISO();
                    await shippingcampaign.save();
                }
            }
            return response.status(201).send(payLoad);
        }
        catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return response.status(500).send({ error: `Falha ao enviar mensagem. Verifique o servidor.ERRO:${error}` });
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