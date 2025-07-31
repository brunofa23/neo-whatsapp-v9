"use strict";
<<<<<<< HEAD
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const util_1 = require("../util");
const luxon_1 = require("luxon");
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
exports.default = async (client, message, chat) => {
    if (message.hasMedia) {
        await (0, util_1.stateTyping)(message);
        client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos, apenas digite uma nota de 0 a 10.');
        return;
    }
    if (chat.interaction_seq == 1) {
        const notes = message.body.replace('1o', '10').match(/\d+/g);
        let invalidNote;
        let invalidNoteNegative;
        if (notes) {
            invalidNote = notes.some(note => parseInt(note) > 10);
            invalidNoteNegative = notes.some(note => parseInt(note) < 0);
        }
        if (notes === null || notes.length == 0 || notes == undefined || invalidNote || invalidNoteNegative) {
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, `Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`);
            await Talk_1.default.create({
                chat_id: chat.id,
                reg: chat.reg,
                cellphone: message.from,
                chatnumber: message.to,
                message_ack: message.ack,
                message: `Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`,
                type: "to"
            });
            return;
        }
        if (Helpers_1.types.isInteger(parseInt(notes[0]))) {
            chat.returned = true;
            chat.absoluteresp = parseInt(notes[0]);
            chat.interaction_seq = 2;
            chat.closed = false;
            chat.date_return = luxon_1.DateTime.now();
            await chat.save();
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`);
            await Talk_1.default.create({
                chat_id: chat.id,
                reg: chat.reg,
                cellphone: message.from,
                chatnumber: message.to,
                message_ack: message.ack,
                message: `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`,
                type: "to"
            });
=======
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const util_1 = require("../util");
exports.default = async (client, message, chat) => {
    if (chat.interaction_seq == 1) {
        const notes = message.body.match(/\d+/g);
        if (notes === null || notes.length == 0 || notes == undefined) {
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, `Desculpe,😔 não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`);
            return;
        }
        if (Helpers_1.types.isInteger(parseInt(notes[0]))) {
            const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields);
            chat.returned = true;
            chat.absoluteresp = parseInt(notes[0]);
            chat.interaction_seq = 2;
            await chat.save();
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Tudo bem se não quiser responder, digite 9 para finalizar essa etapa.`);
            console.log(message.body);
>>>>>>> development
            return;
        }
    }
    else if (chat.interaction_seq == 2) {
        if (message.body == '9') {
            client.sendMessage(message.from, `Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!`);
<<<<<<< HEAD
            await Talk_1.default.create({
                chat_id: chat.id,
                reg: chat.reg,
                cellphone: message.from,
                chatnumber: message.to,
                message: `Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!`,
                type: "to"
            });
            return;
        }
        await (0, util_1.stateTyping)(message);
        chat.date_return = luxon_1.DateTime.now();
        chat.response = message.body.slice(0, 599);
        chat.closed = false;
        await chat.save();
        client.sendMessage(message.from, `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`);
        await Talk_1.default.create({
            chat_id: chat.id,
            reg: chat.reg,
            cellphone: message.from,
            chatnumber: message.to,
            message: `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`,
            type: "to"
        });
=======
            return;
        }
        await (0, util_1.stateTyping)(message);
        chat.response = message.body.slice(0, 599);
        await chat.save();
        client.sendMessage(message.from, `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`);
>>>>>>> development
    }
};
//# sourceMappingURL=ServiceEvaluation.js.map