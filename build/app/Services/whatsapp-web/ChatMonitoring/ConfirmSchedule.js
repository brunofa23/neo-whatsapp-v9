"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DatasourcesController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/DatasourcesController"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const util_1 = require("../util");
exports.default = async (client, message, chat) => {
    if (chat.interaction_seq == 1) {
        const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields);
        if (message.body.toUpperCase() == 'SIM' || message.body == '1') {
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, `Muito obrigada, seu agendamento foi confirmado, o endereço de sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp 3132350003.`);
            chat.response = message.body;
            await chat.save();
            const datasourcesController = new DatasourcesController_1.default;
            await datasourcesController.confirmSchedule(chat.idexternal);
        }
        else if (message.body.toUpperCase() == "NÃO" || message.body.toUpperCase() == "NAO" || message.body.toUpperCase() == "2") {
            chat.response = message.body;
            await chat.save();
            await (0, util_1.stateTyping)(message);
            const message2 = `Entendi, sabemos que nosso dia está muito atarefado. Favor clicar no link que estou enviando para conversar com nossa atendente e podermos agendar novo horário para você.`;
            client.sendMessage(message.from, message2);
            const messageLink = `Olá, sou ${chat.name} e gostaria de reagendar uma consulta com ${chatOtherFields.medic}`;
            const phoneNumber = "553132350003";
            const encodedMessage = encodeURIComponent(messageLink);
            const linkRedirect = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;
            client.sendMessage(message.from, linkRedirect);
            const chat2 = new Chat_1.default();
            chat2.interaction_id = chat.interaction_id;
            chat2.interaction_seq = 2;
            chat2.idexternal = chat.idexternal;
            chat2.reg = chat.reg;
            chat2.name = chat.name;
            chat2.cellphone = chat.cellphone;
            chat2.cellphoneserialized = message.from;
            chat2.shippingcampaigns_id = chat.shippingcampaigns_id;
            chat2.message = message2;
            chat2.response = "Reagendada";
            Chat_1.default.create(chat2);
        }
        else
            (client.sendMessage(message.from, 'Não consegui identificar uma resposta, por favor responda \n*1* para confirmar o agendamento. \n*2* para reagendamento.'));
    }
};
//# sourceMappingURL=ConfirmSchedule.js.map