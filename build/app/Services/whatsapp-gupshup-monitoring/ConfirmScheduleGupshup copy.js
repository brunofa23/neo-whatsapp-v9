"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const SendTextGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendTextGupshup"));
const IdentifyAnswer_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/IdentifyAnswer");
const luxon_1 = require("luxon");
function safeJsonParse(v, fallback) {
    try {
        if (v == null)
            return fallback;
        if (typeof v === 'object')
            return v;
        return JSON.parse(v);
    }
    catch {
        return fallback;
    }
}
function formatMessage(template, fields) {
    return String(template || '')
        .replace('{name_unit}', fields?.name_unit ?? '')
        .replace('{address_unit}', fields?.address_unit || 'Endereço indisponível')
        .replace('{address}', fields?.address || 'Endereço indisponível')
        .replace('{medic}', fields?.medic || 'Médico não informado')
        .replace('{phone_unit}', fields?.phone_unit || 'Contato indisponível')
        .replace('{schedule}', fields?.schedule ?? '');
}
function messageLink(message, phone_unit) {
    const encoded = encodeURIComponent(message || '');
    return `https://api.whatsapp.com/send?phone=${phone_unit}&text=${encoded}`;
}
async function sendTextAndLog(params) {
    const { sourcePhone, destinationPhone, fromDigits, toDigits, chatId, reg, text } = params;
    await (0, SendTextGupshup_1.default)({
        source: sourcePhone,
        destination: destinationPhone,
        text,
    });
    await Talk_1.default.create({
        chat_id: chatId ?? null,
        reg: reg ?? null,
        cellphone: fromDigits,
        chatnumber: toDigits,
        message: text.slice(0, 999),
        type: 'to',
    });
}
async function ConfirmScheduleGupshup(inbound, chat) {
    console.log('PASSO 1 CONFIRM SCHEDULE');
    const fromDigits = String(inbound.from || '').replace(/\D/g, '');
    const toDigits = String(inbound.to || '').replace(/\D/g, '') ||
        String(chat?.chatnumber || '').replace(/\D/g, '');
    let body = String(inbound.body || '').trim();
    const bodyLower = body.toLowerCase();
    if (bodyLower === 'confirmar')
        body = '1';
    if (bodyLower === 'cancelar')
        body = '2';
    if (bodyLower === 'confirmado')
        body = '1';
    if (bodyLower === 'cancelado')
        body = '2';
    if (inbound.hasMedia) {
        const msg = 'Por favor não envie áudio, imagens ou vídeos, apenas digite \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.';
        await sendTextAndLog({
            sourcePhone: toDigits,
            destinationPhone: fromDigits,
            fromDigits,
            toDigits,
            chatId: chat.id,
            reg: chat.reg,
            text: msg,
        });
        return;
    }
    if (chat.interaction_seq !== 1) {
        return;
    }
    const otherfieldsRaw = chat.shippingcampaign?.otherfields;
    const chatOtherFields = safeJsonParse(otherfieldsRaw, {});
    const answer = await (0, IdentifyAnswer_1.interpretAnswer)(body);
    if (answer?.code === 1) {
        const response1schedule = await Response_1.default.query()
            .select('message')
            .where('local', 'response1schedule')
            .andWhere('inactive', false)
            .first();
        const defaultMessage = `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields?.address}. ` +
            `Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chatOtherFields?.phone_unit}.`;
        const responseText = response1schedule?.message
            ? formatMessage(response1schedule.message, chatOtherFields)
            : defaultMessage;
        await sendTextAndLog({
            sourcePhone: toDigits,
            destinationPhone: fromDigits,
            fromDigits,
            toDigits,
            chatId: chat.id,
            reg: chat.reg,
            text: responseText,
        });
        Object.assign(chat, {
            response: body.slice(0, 500),
            returned: true,
            absoluteresp: 1,
            externalstatus: 'A',
            company_id: chat.shippingcampaign?.company_id,
            date_return: luxon_1.DateTime.now().toFormat('yyyy-MM-dd HH:mm'),
        });
        await chat.save();
        return;
    }
    if (answer?.code === 2) {
        Object.assign(chat, {
            response: body.slice(0, 500),
            absoluteresp: 2,
            externalstatus: 'A',
            company_id: chat.shippingcampaign?.company_id,
            date_return: luxon_1.DateTime.now().toFormat('yyyy-MM-dd HH:mm'),
        });
        await chat.save();
        const response2schedule = await Response_1.default.query()
            .select('message')
            .where('local', 'response2schedule')
            .andWhere('inactive', false)
            .first();
        const default2Message = `Entendi 😉, sabemos que nosso dia está muito atarefado! Sua consulta foi desmarcada, ` +
            `se deseja reagendar, clique no link que estou enviando para conversar com uma de nossas atendentes e podermos agendar novo horário mais conveniente para você.`;
        const msg2 = response2schedule?.message
            ? formatMessage(response2schedule.message, chatOtherFields)
            : default2Message;
        await sendTextAndLog({
            sourcePhone: toDigits,
            destinationPhone: fromDigits,
            fromDigits,
            toDigits,
            chatId: chat.id,
            reg: chat.reg,
            text: msg2,
        });
        const response2schedule2 = await Response_1.default.query().where('local', 'response2schedule2').first();
        if (response2schedule2 && response2schedule2.inactive === false) {
            const linkRedirect = messageLink(response2schedule2.message, chatOtherFields?.phone_unit);
            await sendTextAndLog({
                sourcePhone: toDigits,
                destinationPhone: fromDigits,
                fromDigits,
                toDigits,
                chatId: chat.id,
                reg: chat.reg,
                text: linkRedirect,
            });
        }
        else {
            const msgLink = `Olá, sou ${chat.name} e gostaria de reagendar uma consulta com ${chatOtherFields?.medic}.`;
            const phoneUnit = chatOtherFields?.phone_unit || chat.shippingcampaign?.phone_unit;
            const linkRedirect = messageLink(msgLink, phoneUnit);
            await sendTextAndLog({
                sourcePhone: toDigits,
                destinationPhone: fromDigits,
                fromDigits,
                toDigits,
                chatId: chat.id,
                reg: chat.reg,
                text: linkRedirect,
            });
        }
        const chat2 = new Chat_1.default();
        Object.assign(chat2, {
            interaction_id: chat.interaction_id,
            interaction_seq: 2,
            idexternal: chat.idexternal,
            reg: chat.reg,
            name: chat.name,
            cellphone: chat.cellphone,
            cellphoneserialized: fromDigits,
            shippingcampaigns_id: chat.shippingcampaigns_id,
            message: msg2.slice(0, 348),
            response: 'Reagendada',
            returned: true,
            company_id: chat.shippingcampaign?.company_id,
        });
        await Chat_1.default.create(chat2);
        return;
    }
    if (answer?.code === 3) {
        const defaultMessage = `Desculpe pelo engano, vou pedir para corrigir nosso cadastro.`;
        await sendTextAndLog({
            sourcePhone: toDigits,
            destinationPhone: fromDigits,
            fromDigits,
            toDigits,
            chatId: chat.id,
            reg: chat.reg,
            text: defaultMessage,
        });
        return;
    }
    const invalid = 'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.';
    await sendTextAndLog({
        sourcePhone: toDigits,
        destinationPhone: fromDigits,
        fromDigits,
        toDigits,
        chatId: chat.id,
        reg: chat.reg,
        text: invalid,
    });
}
exports.default = ConfirmScheduleGupshup;
//# sourceMappingURL=ConfirmScheduleGupshup%20copy.js.map