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
async function getChat(cellphone, agentPhone) {
    const phoneAgent = onlyDigits(agentPhone);
    return await Chat_1.default.query()
        .preload('shippingcampaign')
        .where('cellphoneserialized', cellphone)
        .andWhere('chatnumber', phoneAgent)
        .orderBy('created_at', 'desc')
        .whereNull('response')
        .first();
}
class GupshupMonitoring {
    async handleInbound(message) {
        const fromDigits = onlyDigits(message.from);
        const toDigits = onlyDigits(message.to);
        const body = String(message.body || '');
        const hasMedia = !!message.hasMedia;
        await Log_1.default.create({
            name: 'gupshup_inbound',
            message: JSON.stringify({
                at: luxon_1.DateTime.now().toISO(),
                from: fromDigits,
                to: toDigits,
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
        const chat = await getChat(fromDigits, toDigits);
        console.log('GUPSHUP MONITORING => chat encontrado?', !!chat, 'from', fromDigits, 'to', toDigits);
        if (!chat) {
            return;
        }
        if (chat.interaction_id === 1) {
            console.log("PASSEI AQUI@@@@@@@@@@@@@@@@@", fromDigits, "-", toDigits, '"-"', body, "hasmedia", hasMedia, "chat:");
            await (0, ConfirmScheduleGupshup_1.default)({
                from: fromDigits,
                to: toDigits,
                body,
                hasMedia,
            }, chat);
            return;
        }
    }
}
exports.default = GupshupMonitoring;
//# sourceMappingURL=GupshupMonitoring.js.map