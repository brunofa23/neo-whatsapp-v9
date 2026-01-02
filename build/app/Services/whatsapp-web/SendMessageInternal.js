"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const ListInternalPhrases_1 = __importDefault(require("./ListInternalPhrases"));
const util_1 = require("./util");
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function toCUsJid(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    return digits ? `${digits}@c.us` : null;
}
exports.default = async (client) => {
    console.log('PASSEI NO GRUPO SEND MESSAGE GRUPO');
    const groupId = process.env.INTERNAL_GROUP_ID;
    if (!groupId || !groupId.endsWith('@g.us')) {
        console.log('INTERNAL_GROUP_ID inválido. Ex: 120363170786645695@g.us');
        return;
    }
    if ((await (0, util_1.TimeSchedule)()) === false)
        return;
    try {
        const state = await client.getState().catch(() => null);
        if (!state) {
            console.log('Cliente do WhatsApp desconectado ou inválido.');
            return;
        }
        const phrase = await (0, ListInternalPhrases_1.default)();
        await client.sendMessage(groupId, phrase);
        const DM_CHANCE = 0.3;
        if (Math.random() > DM_CHANCE)
            return;
        const myNumber = String(client.info?.wid?.user || '').replace(/\D/g, '');
        const agents = await Agent_1.default.query()
            .select(['id', 'name', 'number_phone'])
            .where('active', true)
            .where((q) => q.whereNull('deleted').orWhere('deleted', false))
            .whereNotNull('number_phone');
        const candidates = agents
            .map((a) => ({
            id: a.id,
            name: a.name,
            jid: toCUsJid(a.number_phone),
        }))
            .filter((a) => a.jid && !a.jid.startsWith(myNumber + '@'));
        if (candidates.length === 0)
            return;
        const chosen = pickRandom(candidates);
        await client.sendMessage(chosen.jid, phrase);
        console.log(`DM interna enviada para agent ${chosen.id} (${chosen.name}) => ${chosen.jid}`);
    }
    catch (error) {
        console.log('Erro ao enviar mensagem:', error?.message || error);
    }
};
//# sourceMappingURL=SendMessageInternal.js.map