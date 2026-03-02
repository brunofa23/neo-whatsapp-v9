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
function buildTemplateParams(template, chat, formattedBody) {
    if (!template.params_schema)
        return [];
    let schema;
    try {
        schema = JSON.parse(template.params_schema);
    }
    catch (e) {
        console.error('params_schema inválido para template', template.id, template.params_schema);
        return [];
    }
    const params = [];
    const patientName = chat.patient_name ||
        chat.name ||
        chat.person_name ||
        '';
    const reg = chat.reg || formattedBody.reg || '';
    const cellphone = formattedBody.cellphoneserialized ||
        chat.cellphone ||
        '';
    const dataRegistro = chat.createdAt
        ? chat.createdAt.toFormat('dd/MM/yyyy')
        : '';
    const doctorName = chat.doctor_name || '';
    const companyName = chat.company_name || '';
    for (const key of schema) {
        if (!key) {
            params.push('');
            continue;
        }
        if (key.startsWith('literal:')) {
            params.push(key.replace('literal:', ''));
            continue;
        }
        switch (key) {
            case 'patient_name':
                params.push(patientName);
                break;
            case 'data_registro':
                params.push(dataRegistro);
                break;
            case 'reg':
                params.push(reg);
                break;
            case 'cellphone':
                params.push(cellphone);
                break;
            case 'doctor_name':
                params.push(doctorName);
                break;
            case 'company_name':
                params.push(companyName);
                break;
            default:
                console.warn(`Parâmetro de template desconhecido: ${key}`);
                params.push('');
                break;
        }
    }
    return params;
}
class CustomchatsController {
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        const query = Database_1.default.from('chats')
            .select('id', 'reg', 'cellphone', 'cellphoneserialized', 'message', 'response', 'invalidresponse', 'returned', 'chatname', Database_1.default.raw('0 messagesent'), 'chatnumber', Database_1.default.raw('0  phonevalid'), Database_1.default.raw('0 `read`'), Database_1.default.raw('0 viewed'), Database_1.default.raw('0 ack'), Database_1.default.raw('0 path_media'), 'created_at')
            .where('id', params.id)
            .union((query) => {
            query
                .from('customchats')
                .select('id', 'reg', 'cellphone', 'cellphoneserialized', 'message', 'response', 'response', 'returned', 'chatname', 'messagesent', 'chatnumber', 'phonevalid', 'read', 'viewed', 'ack', 'path_media', 'created_at')
                .where('chats_id', params.id);
        });
        const data = await query;
        const now = luxon_1.DateTime.now();
        let lastReturnedAt = null;
        for (const row of data) {
            const returnedValue = row.returned;
            const isReturned = returnedValue === 1 ||
                returnedValue === '1' ||
                returnedValue === true;
            if (!isReturned)
                continue;
            let createdAt = null;
            if (row.created_at instanceof Date) {
                createdAt = luxon_1.DateTime.fromJSDate(row.created_at);
            }
            else if (typeof row.created_at === 'string') {
                createdAt = luxon_1.DateTime.fromISO(row.created_at, { setZone: false });
            }
            if (!createdAt?.isValid)
                continue;
            if (!lastReturnedAt || createdAt > lastReturnedAt) {
                lastReturnedAt = createdAt;
            }
        }
        let windowExpired24h = true;
        let diffHours = null;
        if (lastReturnedAt) {
            diffHours = now.diff(lastReturnedAt, 'hours').hours;
            windowExpired24h = diffHours > 24;
        }
        else {
            windowExpired24h = true;
        }
        return response.status(200).send({
            data,
            lastReturnedAt: lastReturnedAt ? lastReturnedAt.toISO() : null,
            diffHours,
            windowExpired24h,
        });
    }
    async sendMessage({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { template_id } = request.only(['template_id']);
        const rawBody = await request.validate(CustomchatValidator_1.default);
        if (template_id !== undefined && template_id !== null && template_id !== '') {
            rawBody.template_id = Number(template_id);
        }
        else {
            rawBody.template_id = rawBody.template_id ?? null;
        }
        const createdAtRaw = rawBody.created_at;
        if (!rawBody.id || !rawBody.cellphoneserialized) {
            return response.badRequest({
                error: 'Campos obrigatórios ausentes (id ou cellphoneserialized).',
            });
        }
        const formattedBody = {
            ...rawBody,
            cellphoneserialized: (await (0, util_1.normalizePhoneKey)(rawBody.cellphoneserialized)) || null,
            messagesent: false,
            chats_id: rawBody.id,
        };
        delete formattedBody.returned;
        delete formattedBody.created_at;
        delete formattedBody.id;
        delete formattedBody.response;
        delete formattedBody.template_id;
        try {
            const agent = await Agent_1.default.query().where('default_chat', true).firstOrFail();
            const chat = await Chat_1.default.findOrFail(formattedBody.chats_id);
            let template = null;
            let templateIdExternal = null;
            if (rawBody.template_id) {
                template = await Template_1.default.findOrFail(rawBody.template_id);
                templateIdExternal = template.id_external;
                if (!templateIdExternal) {
                    throw new Error(`Template ${template.id} sem id_external configurado`);
                }
            }
            let gupshupGsId = null;
            let ackInitial = 0;
            const templateParams = template && rawBody.template_id
                ? buildTemplateParams(template, chat, formattedBody)
                : [];
            let shouldSendTemplate = false;
            if (createdAtRaw && rawBody.template_id) {
                const query = Customchat_1.default.query()
                    .where('chats_id', rawBody.id)
                    .where('returned', true)
                    .orderBy('created_at', 'desc');
                const customChat = await query.first();
                console.log(query.toQuery());
                const createdAt = customChat?.createdAt;
                if (!createdAt) {
                    shouldSendTemplate = true;
                    console.log('CREATED_AT NULO → shouldSendTemplate = true');
                }
                else if (createdAt && createdAt.isValid) {
                    const diffHours = luxon_1.DateTime.now()
                        .setZone('America/Sao_Paulo')
                        .diff(createdAt, 'hours').hours;
                    console.log('DIFF HOURS:', diffHours);
                    shouldSendTemplate = diffHours > 23;
                }
                else {
                    shouldSendTemplate = false;
                }
            }
            console.log('ÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇÇ FORMATED:', shouldSendTemplate);
            if (rawBody.template_id && templateIdExternal && shouldSendTemplate) {
                const result = await (0, SendMessageGupshup_1.default)({
                    agent,
                    destination: formattedBody.cellphoneserialized,
                    templateId: templateIdExternal,
                    params: templateParams,
                    useDefaultApiKey: true,
                });
                console.log('PASSO 1 - TEMPLATE ENVIADO....', result);
                const id = result?.messageId ??
                    result?.whatsappMessageId ??
                    result?.payload?.whatsappMessageId ??
                    result?.id ??
                    result?.gsId;
                if (id) {
                    gupshupGsId = String(id);
                    ackInitial = 1;
                }
            }
            else if (rawBody.template_id && !shouldSendTemplate) {
                console.log('Template NÃO enviado (menos de 23h desde created_at ou data inválida)');
            }
            if (formattedBody.message && String(formattedBody.message).trim() !== '') {
                const result = await (0, SendTextGupshup_1.default)({
                    source: agent.gupshup_source,
                    destination: formattedBody.cellphoneserialized,
                    text: formattedBody.message,
                    useDefaultApiKey: true,
                });
                console.log('PASSO 2 - SEND TEXT....', result);
                const id = result?.messageId ??
                    result?.whatsappMessageId ??
                    result?.payload?.whatsappMessageId ??
                    result?.id ??
                    result?.gsId;
                if (id) {
                    gupshupGsId = String(id);
                    ackInitial = 1;
                }
            }
            else {
                console.log('Nenhum texto livre para enviar (message vazia).');
            }
            let mensagemParaHistorico = '';
            if (template && template.description) {
                let descricao = String(template.description);
                if (template.params_schema) {
                    try {
                        const schema = JSON.parse(template.params_schema);
                        const paramsByKey = {};
                        schema.forEach((key, idx) => {
                            if (!key)
                                return;
                            paramsByKey[key] = templateParams[idx] ?? '';
                        });
                        descricao = descricao.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
                            return String(paramsByKey[key] ?? '');
                        });
                    }
                    catch (e) {
                        console.error('Erro ao montar mensagem a partir de description do template:', e);
                    }
                }
                mensagemParaHistorico = descricao;
            }
            else if (formattedBody.message && String(formattedBody.message).trim() !== '') {
                mensagemParaHistorico = String(formattedBody.message);
            }
            else if (formattedBody.path_media) {
                mensagemParaHistorico = '[Áudio / mídia enviada]';
            }
            else if (templateIdExternal) {
                mensagemParaHistorico =
                    `TEMPLATE ${templateIdExternal} | params: ${templateParams.join(' | ')}`;
            }
            formattedBody.message = mensagemParaHistorico;
            let payLoad;
            try {
                payLoad = await Customchat_1.default.create({
                    ...formattedBody,
                    chatnumber: agent.gupshup_source,
                    chatname: agent?.name,
                    messagesent: true,
                    gupshup_gs_id: gupshupGsId,
                    ack: ackInitial,
                });
                console.log('RETORNO:', agent.name, ' | gupshup_gs_id:', gupshupGsId);
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
        catch (error) {
            console.log('ERRO GUPSHUP DATA >>>', error.response?.data);
            console.error('Erro ao enviar mensagem Gupshup:', error);
            return response
                .status(500)
                .send({ error: `Falha ao enviar mensagem via Gupshup. ERRO: ${error}` });
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