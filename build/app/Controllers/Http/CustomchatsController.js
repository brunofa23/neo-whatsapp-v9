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
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const Template_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Template"));
const SendMessageGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendMessageGupshup"));
const SendTextGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendTextGupshup"));
const CustomchatValidator_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Validators/CustomchatValidator"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
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
        console.log('PASSEI AQUI');
        const { template_id } = request.only(['template_id']);
        const rawBody = await request.validate(CustomchatValidator_1.default);
        rawBody.template_id = 1;
        console.log("#####", rawBody);
        const createdAtRaw = rawBody.created_at;
        if (!rawBody.id || !rawBody.cellphoneserialized) {
            return response.badRequest({
                error: 'Campos obrigatórios ausentes (id ou cellphoneserialized).',
            });
        }
        if (!rawBody.template_id) {
            return response.badRequest({
                error: 'template_id é obrigatório para envio via Gupshup.',
            });
        }
        const formattedBody = {
            ...rawBody,
            cellphoneserialized: await (0, util_1.normalizePhoneKey)(rawBody.cellphoneserialized) || null,
            messagesent: false,
            chats_id: rawBody.id,
        };
        console.log("FFFFFFFFFFFFFFFFFFFFFFFF", formattedBody);
        delete formattedBody.returned;
        delete formattedBody.created_at;
        delete formattedBody.id;
        delete formattedBody.response;
        delete formattedBody.template_id;
        try {
            const agent = await Agent_1.default.query().where('default_chat', true).firstOrFail();
            const chat = await Chat_1.default.findOrFail(formattedBody.chats_id);
            const patientName = chat.patient_name ||
                chat.name ||
                chat.person_name ||
                '';
            const template = await Template_1.default.findOrFail(rawBody.template_id);
            const templateId = template.id_external;
            if (!templateId) {
                throw new Error(`Template ${template.id} sem id_external configurado`);
            }
            const templateParams = [
                patientName,
            ];
            let shouldSendTemplate = false;
            if (createdAtRaw) {
                const customChat = await Customchat_1.default
                    .query()
                    .where('chats_id', rawBody.id)
                    .orderBy('created_at', 'desc')
                    .first();
                const createdAt = customChat?.createdAt;
                console.log('CREATED_AT:', createdAt?.toISO?.());
                if (createdAt && createdAt.isValid) {
                    const diffHours = luxon_1.DateTime.now()
                        .setZone('America/Sao_Paulo')
                        .diff(createdAt, 'hours').hours;
                    console.log('DIFF HOURS:', diffHours);
                    shouldSendTemplate = diffHours > 23;
                }
                else {
                    shouldSendTemplate = false;
                }
                if (shouldSendTemplate) {
                    const { status, messageId } = await (0, SendMessageGupshup_1.default)({
                        agent,
                        destination: formattedBody.cellphoneserialized,
                        templateId,
                        params: templateParams,
                        useDefaultApiKey: true,
                    });
                    console.log("PASSO 1 - NÃO PODE PASSAR POR AQUI....");
                }
                else {
                    console.log('Template NÃO enviado (menos de 23h desde created_at)');
                }
                const sendText = await (0, SendTextGupshup_1.default)({
                    source: agent.gupshup_source,
                    destination: formattedBody.cellphoneserialized,
                    text: formattedBody.message,
                    useDefaultApiKey: true,
                });
                console.log("PASSO 2 - TEM QUE PASSAR POR AQUI....", sendText);
                const mensagemParaHistorico = formattedBody.message ||
                    `TEMPLATE ${templateId} | params: ${templateParams.join(' | ')}`;
                formattedBody.message = mensagemParaHistorico;
                let payLoad;
                try {
                    payLoad = await Customchat_1.default.create({
                        ...formattedBody,
                        chatnumber: agent.gupshup_source,
                        messagesent: true,
                    });
                }
                catch (error) {
                    console.log('Erro ao salvar Customchat:', error);
                }
                await Talk_1.default.create({
                    chat_id: formattedBody.chats_id,
                    reg: formattedBody.reg,
                    cellphone: formattedBody.cellphoneserialized,
                    message: mensagemParaHistorico,
                    chatnumber: agent.gupshup_source,
                    type: 'to',
                });
                await Chat_1.default.query()
                    .where('id', formattedBody.chats_id)
                    .update({ last_response: 1 });
                if (chat.shippingcampaigns_id) {
                    const shippingcampaign = await Shippingcampaign_1.default.find(chat.shippingcampaigns_id);
                    if (shippingcampaign && !shippingcampaign.date_first_return) {
                        shippingcampaign.date_first_return = luxon_1.DateTime.now().setZone('America/Sao_Paulo');
                        await shippingcampaign.save();
                    }
                }
                return response.status(201).send(payLoad || formattedBody);
            }
            try { }
            catch (error) {
                console.log('ERRO GUPSHUP DATA >>>', error.response?.data);
                console.error('Erro ao enviar mensagem Gupshup:', error);
                return response
                    .status(500)
                    .send({ error: `Falha ao enviar mensagem via Gupshup. ERRO: ${error}` });
            }
        }
        finally {
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