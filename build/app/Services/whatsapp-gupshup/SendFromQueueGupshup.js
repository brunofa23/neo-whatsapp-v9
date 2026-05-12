"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShippingcampaignsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ShippingcampaignsController"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const Interaction_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Interaction"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const luxon_1 = require("luxon");
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
const SendMessageGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendMessageGupshup"));
const shippingcampaignsController = new ShippingcampaignsController_1.default();
const dayBefore5 = luxon_1.DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00');
function onlyDigits(v) {
    return String(v || '').replace(/\D/g, '');
}
async function verifyClientSend(chatnumberKey, cellphone) {
    const query = Chat_1.default.query()
        .where('cellphone', cellphone)
        .andWhere('created_at', '>', dayBefore5)
        .andWhere('chatnumber', chatnumberKey);
    console.log(query.toQuery());
    return Chat_1.default.query()
        .where('cellphone', cellphone)
        .andWhere('created_at', '>', dayBefore5)
        .andWhere('chatnumber', chatnumberKey)
        .first();
}
async function verifyChatAlreadySaved(shippingCampaign) {
    return Chat_1.default.query()
        .where('interaction_id', shippingCampaign?.interaction_id)
        .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
        .andWhere('shippingcampaigns_id', shippingCampaign?.id)
        .andWhereNull('excluded')
        .first();
}
function safeParseParams(jsonText) {
    try {
        const arr = JSON.parse(jsonText || '[]');
        if (!Array.isArray(arr))
            return [];
        return arr.map((x) => String(x));
    }
    catch {
        return [];
    }
}
async function countCampaignSentToday(interactionId) {
    const start = luxon_1.DateTime.local().startOf('day').toSQL({ includeOffset: false });
    const end = luxon_1.DateTime.local().endOf('day').toSQL({ includeOffset: false });
    const result = await Shippingcampaign_1.default.query()
        .where('interaction_id', interactionId)
        .andWhere('messagesent', true)
        .andWhere('created_at', '>=', start)
        .andWhere('created_at', '<=', end)
        .count('* as total');
    const row = result[0];
    const total = row && row.$extras && row.$extras.total != null
        ? Number(row.$extras.total)
        : 0;
    return total;
}
async function SendFromQueueGupshup(agent) {
    try {
        if ((await (0, util_1.TimeSchedule)()) === false)
            return;
        const shippingCampaign = await shippingcampaignsController.patientToSend(agent);
        if (!shippingCampaign)
            return;
        const isPriority = !!shippingCampaign?.prioritysend;
        const chatnumberKey = onlyDigits(agent.gupshup_source || '');
        if (!chatnumberKey) {
            return;
        }
        console.log('PASSO 1');
        const totMessageSend = await shippingcampaignsController.maxLimitSendMessage(agent);
        const agentMaxMessage = await Agent_1.default.query().where('id', agent.id).first();
        const maxLimitSendAgent = agentMaxMessage?.max_limit_message || 0;
        if (totMessageSend >= maxLimitSendAgent && !isPriority) {
            console.log(`LIMITE DIÁRIO ATINGIDO (AGENTE / GUPSHUP), Id:${agent.id} Agent:${agent.name} Enviados:${totMessageSend} - Limite:${maxLimitSendAgent}`);
            return;
        }
        const interaction = await Interaction_1.default.query()
            .select('id', 'id_templates_gupshup', 'maxsendlimit', 'status')
            .where('id', shippingCampaign.interaction_id)
            .andWhere('status', true)
            .first();
        if (!interaction) {
            console.log(`INTERACTION INATIVA OU NAO ENCONTRADA (GUPSHUP / interaction_id=${shippingCampaign.interaction_id})`);
            return;
        }
        console.log('PASSO 2');
        const templateId = interaction.idTemplatesGupshup;
        if (!templateId) {
            return;
        }
        const maxLimitCampaign = Number(interaction.maxsendlimit || 0);
        if (maxLimitCampaign > 0 && !isPriority) {
            const totCampaignSentToday = await countCampaignSentToday(Number(shippingCampaign.interaction_id));
            if (totCampaignSentToday >= maxLimitCampaign) {
                console.log(`LIMITE DIÁRIO ATINGIDO (CAMPANHA / interaction_id=${shippingCampaign.interaction_id}) EnviadosHoje:${totCampaignSentToday} - Limite:${maxLimitCampaign}`);
                return;
            }
        }
        console.log('PASSO 3');
        const chatExists = await verifyChatAlreadySaved(shippingCampaign);
        console.log('PASSO 5');
        if (chatExists)
            return;
        const phoneKey = (0, util_1.normalizePhoneKey)(shippingCampaign.cellphone);
        console.log('PASSO 6', phoneKey);
        if (!phoneKey) {
            shippingCampaign.phonevalid = false;
            shippingCampaign.cellphoneserialized = null;
            await shippingCampaign.save();
            return;
        }
        const normalized = await (0, util_1.ValidatePhone)(shippingCampaign.cellphone);
        if (!normalized) {
            shippingCampaign.phonevalid = false;
            shippingCampaign.cellphoneserialized = phoneKey;
            await shippingCampaign.save();
            return;
        }
        const destination = normalized;
        const params = safeParseParams(shippingCampaign.gupshupParams);
        if (params.length === 0) {
            return;
        }
        const fileName = String(shippingCampaign.file_path || '').trim();
        let message = undefined;
        if (fileName) {
            const appUrl = Env_1.default.get('APP_URL');
            const fileUrl = `${appUrl}/filetosend/${encodeURIComponent(fileName)}`;
            console.log('fileName:', fileName);
            console.log('fileUrl:', fileUrl);
            message = {
                type: 'document',
                document: {
                    link: fileUrl,
                    filename: fileName,
                },
            };
        }
        const { status, messageId } = await (0, SendMessageGupshup_1.default)({
            agent,
            destination,
            templateId,
            params,
            message,
        });
        shippingCampaign.messagesent = true;
        shippingCampaign.phonevalid = true;
        shippingCampaign.cellphoneserialized = phoneKey;
        await shippingCampaign.save();
        const bodyChat = {
            interaction_id: shippingCampaign.interaction_id,
            interaction_seq: shippingCampaign.interaction_seq,
            idexternal: shippingCampaign.idexternal,
            reg: shippingCampaign.reg,
            name: shippingCampaign.name,
            cellphone: shippingCampaign.cellphone,
            cellphoneserialized: phoneKey,
            message: shippingCampaign.message,
            shippingcampaigns_id: shippingCampaign.id,
            chatname: agent.name,
            chatnumber: chatnumberKey,
            gupshup_gs_id: messageId,
        };
        const chat = await Chat_1.default.create(bodyChat);
        await Talk_1.default.create({
            cellphone: destination,
            cellphoneserialized: phoneKey,
            chatnumber: chatnumberKey,
            reg: shippingCampaign.reg,
            chat_id: chat.id,
            message: String(shippingCampaign.message || '').slice(0, 999),
            type: 'to',
        });
        console.log('Mensagem enviada (GUPSHUP):', shippingCampaign.name, destination, 'agent', agent.name, 'status', status, 'messageId', messageId);
        if (agent.statusconnected === false || agent.status !== 'GUPSHUP') {
            await Agent_1.default.query().where('id', agent.id).update({ statusconnected: true, status: 'GUPSHUP' });
        }
        return { status, messageId };
    }
    catch (error) {
        console.error('Erro SendFromQueueGupshup:', error);
    }
}
exports.default = SendFromQueueGupshup;
//# sourceMappingURL=SendFromQueueGupshup.js.map