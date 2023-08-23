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
        if (await (0, util_1.PositiveResponse)(message.body)) {
            await (0, util_1.stateTyping)(message);
            try {
                client.sendMessage(message.from, `Muito obrigada, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp 3132350003.`);
                chat.response = message.body.slice(0, 255);
                chat.returned = true;
                chat.absoluteresp = 1;
                await chat.save();
            }
            catch (error) {
                console.log("Erro 454:", error);
            }
            const datasourcesController = new DatasourcesController_1.default;
            await datasourcesController.confirmSchedule(chat.idexternal);
        }
        else if (await (0, util_1.NegativeResponse)(message.body)) {
            chat.response = message.body;
            chat.absoluteresp = 2;
            try {
                await chat.save();
            }
            catch (error) {
                console.log("Erro 121:", error);
            }
            await (0, util_1.stateTyping)(message);
            const message2 = `Entendi, sabemos que nosso dia está muito atarefado. Favor clicar no link que estou enviando para conversar com nossa atendente e podermos agendar novo horário para você.`;
            client.sendMessage(message.from, message2);
            const messageLink = `Olá, sou ${chat.name} e gostaria de reagendar uma consulta com ${chatOtherFields.medic}.`;
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
            chat2.message = message2.slice(0, 348);
            chat2.response = "Reagendada";
            chat2.returned = true;
            try {
                Chat_1.default.create(chat2);
            }
            catch (error) {
                console.log("Erro:", error);
            }
        }
        else {
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, 'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para confirmar o agendamento. \n*2* para reagendamento.');
        }
    }
};
//# sourceMappingURL=ConfirmSchedule.js.map