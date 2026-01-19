"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const luxon_1 = require("luxon");
const SendTextGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendTextGupshup"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
function onlyDigits(v) {
    return String(v ?? '').replace(/\D/g, '');
}
async function sendText(source, destination, text) {
    const src = onlyDigits(source);
    const dst = onlyDigits(destination);
    if (!src || !dst) {
        throw new Error(`SendTextGupshup inválido: source="${String(source)}" destination="${String(destination)}"`);
    }
    return (0, SendTextGupshup_1.default)({ source: src, destination: dst, text });
}
async function ServiceEvaluationGupshup(inbound, chat) {
    const fromDigits = onlyDigits(inbound?.from);
    const toDigits = onlyDigits(inbound?.to);
    const body = String(inbound?.body || '');
    const hasMedia = !!inbound?.hasMedia;
    const cellphoneserialized = (0, util_1.normalizePhoneKey)(fromDigits);
    const source = onlyDigits(chat?.chatnumber || '') || toDigits;
    console.log('service evaluation @@@@@@@@@@@@@@@@@@', source);
    try {
        if (!source) {
            await Log_1.default.create({
                name: 'ServiceEvaluationGupshupNoSource',
                message: JSON.stringify({
                    at: luxon_1.DateTime.now().toISO(),
                    chat_id: chat?.id,
                    from: fromDigits,
                    inbound_to: toDigits || null,
                    chatnumber: chat?.chatnumber || null,
                    cellphoneserialized: cellphoneserialized || null,
                    note: 'Não foi possível enviar resposta: source (WABA) ausente',
                }),
                description: 'Sem source (WABA) para enviar via Gupshup',
            });
            return;
        }
        if (hasMedia) {
            const text = 'Por favor não envie áudio, imagens ou vídeos, apenas digite uma nota de 0 a 10.';
            await sendText(source, fromDigits, text);
            await Talk_1.default.create({
                chat_id: chat.id,
                reg: chat.reg,
                cellphone: fromDigits,
                cellphoneserialized: cellphoneserialized || null,
                chatnumber: source,
                message_ack: 0,
                message: text,
                type: 'to',
            });
            return;
        }
        console.log('PASSO 1.0 SERVICE');
        if (chat.interaction_seq == 1) {
            console.log('PASSO 1.1 SERVICE');
            const notes = body.replace('1o', '10').match(/\d+/g);
            let invalidNote = false;
            let invalidNoteNegative = false;
            if (notes) {
                invalidNote = notes.some((note) => parseInt(note) > 10);
                invalidNoteNegative = notes.some((note) => parseInt(note) < 0);
            }
            if (!notes || notes.length === 0 || invalidNote || invalidNoteNegative) {
                const text = 'Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?';
                await sendText(source, fromDigits, text);
                await Talk_1.default.create({
                    chat_id: chat.id,
                    reg: chat.reg,
                    cellphone: fromDigits,
                    cellphoneserialized: cellphoneserialized || null,
                    chatnumber: source,
                    message_ack: 0,
                    message: text,
                    type: 'to',
                });
                return;
            }
            const note = parseInt(notes[0]);
            if (Helpers_1.types.isInteger(note)) {
                ;
                chat.returned = true;
                chat.absoluteresp = note;
                chat.interaction_seq = 2;
                chat.closed = false;
                chat.date_return = luxon_1.DateTime.now();
                await chat.save();
                const text = `Consegue nos dizer o que motivou a sua nota ${note}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`;
                await sendText(source, fromDigits, text);
                await Talk_1.default.create({
                    chat_id: chat.id,
                    reg: chat.reg,
                    cellphone: fromDigits,
                    cellphoneserialized: cellphoneserialized || null,
                    chatnumber: source,
                    message_ack: 0,
                    message: text,
                    type: 'to',
                });
                return;
            }
            const text = 'Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?';
            await sendText(source, fromDigits, text);
            await Talk_1.default.create({
                chat_id: chat.id,
                reg: chat.reg,
                cellphone: fromDigits,
                cellphoneserialized: cellphoneserialized || null,
                chatnumber: source,
                message_ack: 0,
                message: text,
                type: 'to',
            });
            return;
        }
        if (chat.interaction_seq == 2) {
            console.log('PASSO 2.1 5555');
            if (body.trim() === '9') {
                const text = 'Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!';
                await sendText(source, fromDigits, text);
                await Talk_1.default.create({
                    chat_id: chat.id,
                    reg: chat.reg,
                    cellphone: fromDigits,
                    cellphoneserialized: cellphoneserialized || null,
                    chatnumber: source,
                    message_ack: 0,
                    message: text,
                    type: 'to',
                });
                return;
            }
            ;
            chat.date_return = luxon_1.DateTime.now();
            chat.response = body.slice(0, 599);
            chat.closed = false;
            await chat.save();
            console.log('PASSO 2.2', body);
            const text = 'Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏';
            await sendText(source, fromDigits, text);
            await Talk_1.default.create({
                chat_id: chat.id,
                reg: chat.reg,
                cellphone: fromDigits,
                cellphoneserialized: cellphoneserialized || null,
                chatnumber: source,
                message_ack: 0,
                message: text,
                type: 'to',
            });
            return;
        }
    }
    catch (error) {
        await Log_1.default.create({
            name: 'ServiceEvaluationGupshupError',
            message: error?.message || String(error),
            description: error?.stack || 'Sem stack',
        });
    }
}
exports.default = ServiceEvaluationGupshup;
//# sourceMappingURL=ServiceEvaluationGupshup.js.map