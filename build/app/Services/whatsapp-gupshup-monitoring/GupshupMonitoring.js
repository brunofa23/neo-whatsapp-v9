"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
const luxon_1 = require("luxon");
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
const ConfirmScheduleGupshup_1 = __importDefault(require("./ConfirmScheduleGupshup"));
const ServiceEvaluationGupshup_1 = __importDefault(require("./ServiceEvaluationGupshup"));
const SendTextGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendTextGupshup"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
const EVALUATION_RESPONSE_LIMIT_HOURS = 72;
const EVALUATION_EXPIRED_MESSAGE = 'Olá! O prazo para responder esta mensagem expirou. As respostas são aceitas em até 72 horas após o envio. Obrigado.';
const WAITING_TIME_RESPONSE_LOCAL = 'waiting_time_keyword';
const WAITING_TIME_KEYWORDS = ['tempo de espera', 'pontualidade', 'atraso'];
const WAITING_TIME_DEFAULT_MESSAGE = 'Olá! Agradecemos o seu contato. A sua satisfação é muito importante para nós. No momento do agendamento, informamos que o tempo estimado de permanência no NEO é de cerca de duas horas, informação que também é reforçada na confirmação enviada por WhatsApp. O horário agendado corresponde ao início do atendimento, que pode variar conforme a necessidade de exames e da dilatação da pupila.';
function onlyDigits(v) {
    return String(v ?? '').replace(/\D/g, '');
}
function normalizeText(value) {
    return String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}
function hasWaitingTimeKeyword(body) {
    const normalizedBody = normalizeText(body);
    return WAITING_TIME_KEYWORDS.some((keyword) => normalizedBody.includes(normalizeText(keyword)));
}
async function getWaitingTimeResponseMessage() {
    const response = await Response_1.default.query()
        .select('message')
        .where('local', WAITING_TIME_RESPONSE_LOCAL)
        .andWhere('inactive', false)
        .orderBy('id', 'desc')
        .first();
    return response?.message || WAITING_TIME_DEFAULT_MESSAGE;
}
async function getGupshupAgentByAppName(appName) {
    const name = String(appName || '').trim();
    if (!name)
        return null;
    return Agent_1.default.query()
        .where('gupshup_src_name', name)
        .where('active', true)
        .where((query) => query.whereNull('deleted').orWhere('deleted', false))
        .first();
}
function safeStringify(value) {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, val) => {
        if (typeof val === 'bigint')
            return val.toString();
        if (typeof val === 'object' && val !== null) {
            if (seen.has(val))
                return '[Circular]';
            seen.add(val);
        }
        return val;
    }, 2);
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
async function getChatByPhone(cellphone, agentPhone, interactionId) {
    const phoneClientKey = (0, util_1.normalizePhoneKey)(cellphone);
    const phoneAgentKey = (0, util_1.normalizePhoneKey)(agentPhone);
    if (!phoneClientKey)
        return null;
    const q = Chat_1.default.query()
        .preload('shippingcampaign')
        .where('cellphoneserialized', phoneClientKey)
        .whereNull('response')
        .orderBy('created_at', 'desc');
    if (phoneAgentKey) {
        q.andWhere('chatnumber', phoneAgentKey);
    }
    if (interactionId !== undefined) {
        q.andWhere('interaction_id', interactionId);
    }
    return q.first();
}
function getChatCreatedAt(chat) {
    const createdAt = chat?.createdAt || chat?.created_at;
    if (!createdAt)
        return null;
    if (luxon_1.DateTime.isDateTime(createdAt))
        return createdAt;
    if (createdAt instanceof Date)
        return luxon_1.DateTime.fromJSDate(createdAt);
    const parsedIso = luxon_1.DateTime.fromISO(String(createdAt));
    if (parsedIso.isValid)
        return parsedIso;
    return luxon_1.DateTime.fromSQL(String(createdAt));
}
function isEvaluationResponseExpired(chat) {
    if (Number(chat?.interaction_id) !== 2)
        return false;
    const createdAt = getChatCreatedAt(chat);
    if (!createdAt?.isValid)
        return false;
    return createdAt.plus({ hours: EVALUATION_RESPONSE_LIMIT_HOURS }) < luxon_1.DateTime.now();
}
async function sendEvaluationExpiredMessage(chat, fromDigits, toDigits) {
    const source = onlyDigits(chat?.chatnumber || '') || toDigits;
    const destination = onlyDigits(fromDigits);
    if (!source || !destination) {
        await Log_1.default.create({
            name: 'GupshupEvaluationExpiredNoSource',
            message: JSON.stringify({
                chat_id: chat?.id ?? null,
                source,
                destination,
            }),
            description: 'Não foi possível enviar aviso de avaliação expirada',
        });
        return;
    }
    await (0, SendTextGupshup_1.default)({
        source,
        destination,
        text: EVALUATION_EXPIRED_MESSAGE,
    });
    await Talk_1.default.create({
        chat_id: chat.id,
        reg: chat.reg,
        cellphone: destination,
        cellphoneserialized: (0, util_1.normalizePhoneKey)(destination) || null,
        chatnumber: source,
        message_ack: 0,
        message: EVALUATION_EXPIRED_MESSAGE,
        type: 'to',
    });
}
async function sendWaitingTimeKeywordResponse(chat, fromDigits, toDigits, sourceFallback = '') {
    const source = onlyDigits(chat?.chatnumber || '') || toDigits || onlyDigits(sourceFallback);
    const destination = onlyDigits(fromDigits);
    if (!source || !destination) {
        await Log_1.default.create({
            name: 'GupshupWaitingTimeNoSource',
            message: JSON.stringify({
                chat_id: chat?.id ?? null,
                source,
                sourceFallback,
                destination,
            }),
            description: 'Não foi possível enviar resposta automática sobre tempo de espera',
        });
        return;
    }
    const text = await getWaitingTimeResponseMessage();
    await (0, SendTextGupshup_1.default)({
        source,
        destination,
        text,
    });
    await Talk_1.default.create({
        chat_id: chat?.id ?? null,
        reg: chat?.reg ?? null,
        cellphone: destination,
        cellphoneserialized: (0, util_1.normalizePhoneKey)(destination) || null,
        chatnumber: source,
        message_ack: 0,
        message: text.slice(0, 999),
        type: 'to',
    });
}
async function saveInboundTalk(fromDigits, fromKey, chatnumber, body) {
    await Talk_1.default.create({
        cellphone: fromDigits,
        cellphoneserialized: fromKey,
        chatnumber,
        message: body.slice(0, 999),
        type: 'from',
    });
}
class GupshupMonitoring {
    async handleInbound(message) {
        const MAX_LOG_LEN = 65000;
        const raw = safeStringify({
            at: luxon_1.DateTime.now().toISO(),
            webhook: message,
        });
        console.log('PASSO 1 1544');
        const truncated = raw.length > MAX_LOG_LEN;
        const fromDigits = onlyDigits(message?.from);
        const toDigits = onlyDigits(message?.to);
        const fromKey = (0, util_1.normalizePhoneKey)(message?.from);
        const toKey = (0, util_1.normalizePhoneKey)(message?.to);
        const body = String(message?.body || '');
        const hasMedia = !!message?.hasMedia;
        const inboundPathMedia = String(message?.raw?.path_media || '').trim();
        const inboundGsId = String(message?.context?.gsId || '').trim();
        const appName = String(message?.appName ||
            message?.app ||
            message?.payload?.appName ||
            message?.payload?.app ||
            message?.raw?.app ||
            '').trim();
        const gupshupAgent = await getGupshupAgentByAppName(appName);
        const sourceFallback = onlyDigits(gupshupAgent?.gupshup_source || '');
        const defaultAgent = gupshupAgent?.default_chat ? gupshupAgent : null;
        if (body && hasWaitingTimeKeyword(body)) {
            await saveInboundTalk(fromDigits, fromKey, sourceFallback || toDigits, body);
            await sendWaitingTimeKeywordResponse(null, fromDigits, toDigits, sourceFallback);
            return;
        }
        if (defaultAgent) {
            console.log('ENTREI NO DEFAULT...');
            console.log('.....', appName);
            const query = Customchat_1.default.query()
                .where('cellphoneserialized', fromKey)
                .andWhere('chatname', appName)
                .andWhereNull('returned')
                .orderBy('created_at', 'desc');
            const openCustom = await query.first();
            console.log('>>>>>>>>>111111>', query.toQuery());
            if (!openCustom?.chats_id) {
                console.log('❌ DEFAULT_CHAT: não encontrei openCustom com chats_id. Não vou criar Chat. Abortando.', {
                    appName,
                    fromKey,
                    fromDigits,
                    toDigits,
                    hasMedia,
                    inboundPathMedia: inboundPathMedia || null,
                });
                return;
            }
            await Customchat_1.default.create({
                chats_id: openCustom.chats_id,
                reg: openCustom?.reg || null,
                cellphone: openCustom?.cellphone || fromDigits,
                cellphoneserialized: fromKey,
                chatnumber: toDigits || null,
                chatname: appName || null,
                returned: true,
                viewed: false,
                response: body ? body.slice(0, 999) : '',
                path_media: hasMedia && inboundPathMedia ? inboundPathMedia : null,
            });
            return;
        }
        await saveInboundTalk(fromDigits, fromKey, toDigits, body);
        let chat = null;
        if (inboundGsId) {
            chat = await getChatByGsId(inboundGsId);
        }
        if (!chat) {
            const evaluationChat = await getChatByPhone(fromDigits, toDigits, 2);
            chat = evaluationChat || (await getChatByPhone(fromDigits, toDigits));
        }
        console.log('GUPSHUP MONITORING => chat encontrado?', !!chat, 'fromDigits', fromDigits, 'fromKey', fromKey, 'toDigits', toDigits || '-', 'toKey', toKey || '-', 'gsId', inboundGsId || '-', 'appName', appName || '-');
        if (!chat) {
            return;
        }
        if (isEvaluationResponseExpired(chat)) {
            await sendEvaluationExpiredMessage(chat, fromDigits, toDigits);
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
        if (chat.interaction_id === 2) {
            await (0, ServiceEvaluationGupshup_1.default)({
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