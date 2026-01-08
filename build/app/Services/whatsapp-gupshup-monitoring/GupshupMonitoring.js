"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const luxon_1 = require("luxon");
const ConfirmScheduleGupshup_1 = __importDefault(require("./ConfirmScheduleGupshup"));
function onlyDigits(v) {
    return String(v ?? '').replace(/\D/g, '');
}
async function getChatByGsId(gsId) {
    const id = String(gsId || '').trim();
    if (!id)
        return null;
    return Chat_1.default.query()
        .preload('shippingcampaign')
        .where('gupshup_gs_id', id)
        .whereNull('response')
        .orderBy('created_at', 'desc')
        .first();
}
async function getChatByPhone(cellphone, agentPhone) {
    const phoneAgent = onlyDigits(agentPhone);
    const phoneClient = onlyDigits(cellphone);
    if (!phoneClient)
        return null;
    const q = Chat_1.default.query()
        .preload('shippingcampaign')
        .where('cellphoneserialized', phoneClient)
        .whereNull('response')
        .orderBy('created_at', 'desc');
    if (phoneAgent)
        q.andWhere('chatnumber', phoneAgent);
    return q.first();
}
class GupshupMonitoring {
    async handleInbound(message) {
        const fromDigits = onlyDigits(message?.from);
        const toDigits = onlyDigits(message?.to);
        const body = String(message?.body || '');
        const hasMedia = !!message?.hasMedia;
        const inboundGsId = String(message?.context?.gsId || '').trim();
        await Log_1.default.create({
            name: 'gupshup_inbound',
            message: JSON.stringify({
                at: luxon_1.DateTime.now().toISO(),
                from: fromDigits,
                to: toDigits || null,
                gsId: inboundGsId || null,
                body: body.slice(0, 200),
                hasMedia,
            }),
            description: 'GUPSHUP WEBHOOK INBOUND',
        });
        await Talk_1.default.create({
            cellphone: fromDigits,
            chatnumber: toDigits,
            message: body.slice(0, 999),
            type: 'from',
        });
        let chat = null;
        if (inboundGsId) {
            chat = await getChatByGsId(inboundGsId);
        }
        if (!chat) {
            chat = await getChatByPhone(fromDigits, toDigits);
        }
        console.log('GUPSHUP MONITORING => chat encontrado?', !!chat, 'from', fromDigits, 'to', toDigits || '-', 'gsId', inboundGsId || '-');
        if (!chat) {
            return;
        }
        if (chat.interaction_id === 1) {
            await (0, ConfirmScheduleGupshup_1.default)({
                from: fromDigits,
                to: toDigits,
                body,
                hasMedia,
                context: inboundGsId ? { gsId: inboundGsId } : undefined,
            }, chat);
            return;
        }
    }
}
exports.default = GupshupMonitoring;
//# sourceMappingURL=GupshupMonitoring.js.map