"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
const MidiasController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/MidiasController"));
const util_1 = require("../util");
const ConfirmSchedule_1 = __importDefault(require("./ConfirmSchedule"));
const ServiceEvaluation_1 = __importDefault(require("./ServiceEvaluation"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const luxon_1 = require("luxon");
const aiResponder_1 = global[Symbol.for('ioc.use')]("App/Services/Ai/aiResponder");
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const messageTracker = new Map();
function isBotLoopDetected(phone) {
    const now = Date.now();
    const record = messageTracker.get(phone);
    if (!record) {
        messageTracker.set(phone, { count: 1, lastMessage: now });
        return false;
    }
    const diff = now - record.lastMessage;
    if (diff < 5000) {
        record.count++;
        record.lastMessage = now;
        if (record.count >= 3) {
            console.warn(`Possível loop de bot detectado com ${phone}. Ignorando temporariamente.`);
            return true;
        }
    }
    else {
        messageTracker.set(phone, { count: 1, lastMessage: now });
    }
    return false;
}
const INTERNAL_CACHE_TTL_MS = 5 * 60 * 1000;
let internalDigitsCache = new Set();
let internalCacheAt = 0;
let refreshPromise = null;
function onlyDigits(v) {
    return String(v ?? '').replace(/\D/g, '');
}
async function refreshInternalAgentsCache(force = false) {
    const now = Date.now();
    if (!force && internalDigitsCache.size > 0 && now - internalCacheAt < INTERNAL_CACHE_TTL_MS)
        return;
    if (refreshPromise)
        return refreshPromise;
    refreshPromise = (async () => {
        try {
            const agents = await Agent_1.default.query()
                .select(['number_phone'])
                .where('active', true)
                .where((q) => q.whereNull('deleted').orWhere('deleted', false))
                .whereNotNull('number_phone');
            const set = new Set();
            for (const a of agents) {
                const digits = onlyDigits(a.number_phone);
                if (digits)
                    set.add(digits);
            }
            internalDigitsCache = set;
            internalCacheAt = now;
        }
        finally {
            refreshPromise = null;
        }
    })();
    return refreshPromise;
}
async function isInternalAgentByDigits(phoneDigits) {
    await refreshInternalAgentsCache(false);
    return internalDigitsCache.has(phoneDigits);
}
async function getCustomChat(cellphone, chatnumber) {
    chatnumber = chatnumber.replace(/@.*$/, '');
    return await Customchat_1.default.query()
        .where('cellphoneserialized', cellphone)
        .andWhere('chatnumber', chatnumber)
        .andWhereNull('returned')
        .orderBy('created_at', 'desc')
        .first();
}
async function getChat(cellphone, agentPhone) {
    const match = agentPhone.match(/\d/g);
    const phoneAgent = match ? match.join('') : '';
    return await Chat_1.default.query()
        .preload('shippingcampaign')
        .where('cellphoneserialized', cellphone)
        .andWhere('chatnumber', phoneAgent)
        .orderBy('created_at', 'desc')
        .whereNull('response')
        .first();
}
async function resolveJid(client, jid) {
    if (!jid)
        return { jid, phoneJid: null, phoneDigits: '' };
    if (jid.endsWith('@c.us')) {
        return { jid, phoneJid: jid, phoneDigits: onlyDigits(jid) };
    }
    if (jid.endsWith('@lid')) {
        try {
            const result = await client.getContactLidAndPhone([jid]);
            const item = result?.[0];
            const pn = item?.pn || null;
            return { jid, phoneJid: pn, phoneDigits: onlyDigits(pn) };
        }
        catch {
            return { jid, phoneJid: null, phoneDigits: '' };
        }
    }
    return { jid, phoneJid: null, phoneDigits: onlyDigits(jid) };
}
function shouldIgnoreMessage(message) {
    const from = message.from ?? '';
    return (message.fromMe === true ||
        message.type?.toLowerCase() === 'e2e_notification' ||
        (message.body === '' && !message.hasMedia) ||
        from.includes('@broadcast') ||
        from.includes('@status'));
}
class Monitoring {
    async monitoring(client) {
        try {
            client.on('message', async (message) => {
                if (shouldIgnoreMessage(message))
                    return;
                const isGroup = message.from?.endsWith('@g.us');
                const resolvedFrom = await resolveJid(client, message.from);
                const fromResolved = resolvedFrom.phoneJid || message.from;
                const resolvedAuthor = isGroup && message.author ? await resolveJid(client, message.author) : null;
                const senderDigits = isGroup
                    ? (resolvedAuthor?.phoneDigits || onlyDigits(message.author))
                    : onlyDigits(fromResolved);
                if (senderDigits && (await isInternalAgentByDigits(senderDigits))) {
                    console.log(`Ignorando mensagem interna (agent) => ${senderDigits}`);
                    return;
                }
                if (isGroup) {
                    const body = (message.body || '').trim().toLowerCase();
                    if (body.includes('idgroup')) {
                        const groupId = message.from;
                        const toReply = resolvedAuthor?.phoneJid || message.author || fromResolved;
                        if (toReply) {
                            await (0, util_1.stateTyping)(message);
                            await client.sendMessage(toReply, `ID do grupo: ${groupId}`);
                        }
                    }
                    return;
                }
                if (isBotLoopDetected(fromResolved)) {
                    console.log(`Loop detectado de ${fromResolved}, ignorando resposta.`);
                    return;
                }
                if (message.hasMedia) {
                    await (0, util_1.stateTyping)(message);
                    await client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!');
                    return;
                }
                const customChat = await getCustomChat(fromResolved, client.info.wid.user);
                if (customChat) {
                    await handleCustomChatMessage(message, customChat, fromResolved);
                    return;
                }
                const chat = await getChat(fromResolved, message.to);
                await Log_1.default.create({
                    name: 'fromResolved',
                    message: JSON.stringify({
                        fromOriginal: message.from,
                        fromResolved,
                        to: message.to,
                        isGroup,
                        chatFound: !!chat,
                        chatId: chat?.id ?? null,
                    }),
                    description: 'RESOLVENDO CODIGO PARA NUMERO',
                });
                if (chat) {
                    await handleChatMessage(client, message, chat, fromResolved);
                    return;
                }
                await handleNewMessage(client, message, fromResolved);
            });
        }
        catch (error) {
            console.error('Erro no monitoramento:', error);
        }
    }
}
exports.default = Monitoring;
async function handleCustomChatMessage(message, customChat, fromResolved) {
    let pathMedia = '';
    if (message.hasMedia) {
        const media = await message.downloadMedia();
        const midias = new MidiasController_1.default();
        const fileName = `${customChat.chats_id}_${Date.now()}`;
        pathMedia = await midias.storeMedia(media, fileName, 'Customchats');
        message.body = ' ';
    }
    const bodyResponse = {
        chats_id: customChat.chats_id,
        reg: customChat.reg,
        cellphone: customChat.cellphone,
        cellphoneserialized: customChat.cellphoneserialized,
        chatnumber: customChat.chatnumber,
        returned: true,
        viewed: false,
        response: message.body,
        path_media: pathMedia,
    };
    await Customchat_1.default.create(bodyResponse);
    await Chat_1.default.query()
        .where('id', customChat.chats_id)
        .update({ date_return: luxon_1.DateTime.now().toFormat('yyyy-MM-dd HH:mm'), last_response: 2 });
    await Talk_1.default.create({
        chat_id: customChat.chats_id,
        reg: customChat.reg,
        cellphone: fromResolved,
        chatnumber: message.to,
        message_ack: message.ack,
        message: message.body.slice(0, 999),
        type: 'from',
    });
}
async function handleChatMessage(client, message, chat, fromResolved) {
    await Talk_1.default.create({
        chat_id: chat.id,
        reg: chat.reg,
        cellphone: fromResolved,
        chatnumber: message.to,
        message_ack: message.ack,
        message: message.body.slice(0, 999),
        type: 'from',
    });
    if (!chat.returned) {
        chat.invalidresponse = message.body.slice(0, 348);
        chat.returned = true;
        await chat.save();
    }
    global.contSend--;
    if (chat.interaction_id === 1) {
        await (0, ConfirmSchedule_1.default)(client, message, chat);
    }
    else if (chat.interaction_id === 2) {
        await (0, ServiceEvaluation_1.default)(client, message, chat);
    }
}
async function handleNewMessage(client, message, fromResolved) {
    try {
        await Talk_1.default.create({
            cellphone: fromResolved,
            chatnumber: message.to,
            message_ack: message.ack,
            message: message.body.slice(0, 999),
            type: 'from',
        });
        const query = await Shippingcampaign_1.default.query()
            .where('cellphoneserialized', fromResolved)
            .where('interaction_id', 1)
            .select('otherfields', 'name');
        const queryTalk = await Talk_1.default.query()
            .where('cellphone', fromResolved)
            .andWhere('chatnumber', message.to);
        const context = query.map((item) => `name:${item.name} \n${item.otherfields}`).join('\n');
        const contextTalk = queryTalk.map((item) => item.message).join('\n');
        const fullContext = context + '\n\n' + contextTalk;
        const response = await (0, aiResponder_1.responderPergunta)(message.body, fullContext);
        if (response) {
            await (0, util_1.stateTyping)(message);
            await client.sendMessage(message.from, response);
            await Talk_1.default.create({
                cellphone: fromResolved,
                chatnumber: message.to,
                message_ack: message.ack,
                message: response.slice(0, 999),
                type: 'to',
            });
        }
        else {
            await sendRandomFinalMessage(client, message);
        }
    }
    catch (error) {
        console.error('Erro ao processar mensagem:', error);
        await client.sendMessage(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem.');
    }
}
async function sendRandomFinalMessage(client, message) {
    let responseArray;
    const responsesChatfinish = await Response_1.default.query().select('message').where('local', 'chatfinish');
    if (responsesChatfinish.length > 0)
        responseArray = responsesChatfinish.map((r) => r.message);
    else
        responseArray = [
            'Desculpe, mas esta conversa já foi finalizada. O Neo Agradece por sua compreensão, para maiores esclarecimentos ligue para 31-32350003.',
            'Infelizmente esta conversa já foi finalizada. O Neo Agradece por sua interação! Maiores esclarecimentos ligue para 31-32350003.',
            'Olá, sou apenas uma atendente virtual, para maiores esclarecimentos ligue para 31-32350003.',
            'Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi finalizada. Para maiores esclarecimentos ligue para 31-32350003. O Neo Agradece!',
        ];
    const randomMessage = await (0, util_1.RandomResponse)(responseArray);
    await (0, util_1.stateTyping)(message);
    await client.sendMessage(message.from, randomMessage);
}
//# sourceMappingURL=ChatMonitoring.js.map