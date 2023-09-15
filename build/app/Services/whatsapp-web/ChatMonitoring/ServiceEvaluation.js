"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const util_1 = require("../util");
exports.default = async (client, message, chat) => {
    if (chat.interaction_seq == 1) {
        const notes = message.body.match(/\d+/g);
        if (notes === null || notes.length == 0 || notes == undefined) {
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, `Desculpe, não consegui identificar sua nota. Por favor poderia responder uma nota entre 0 a 10?`);
            return;
        }
        if (Helpers_1.types.isInteger(parseInt(notes[0]))) {
            const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields);
            chat.returned = true;
            chat.absoluteresp = parseInt(notes[0]);
            chat.interaction_seq = 2;
            await chat.save();
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, `Consegue nos dizer o que motivou a sua nota ${notes[0]}? Caso não queira responder digite 9 para finalizar essa etapa.`);
            console.log(message.body);
            return;
        }
    }
    else if (chat.interaction_seq == 2) {
        if (message.body == '9') {
            client.sendMessage(message.from, `Tudo bem, vamos finalizar nossa conversa.🙏Obrigado!`);
            return;
        }
        await (0, util_1.stateTyping)(message);
        chat.response = message.body.slice(0, 599);
        await chat.save();
        client.sendMessage(message.from, `Obrigado pela sua resposta!😀 Agradecemos sua avaliação.🙏`);
    }
};
//# sourceMappingURL=ServiceEvaluation.js.map