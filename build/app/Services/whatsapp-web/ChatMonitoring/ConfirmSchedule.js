"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
<<<<<<< HEAD
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
const IdentifyAnswer_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/IdentifyAnswer");
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
exports.default = async (client, message, chat) => {
    const formatMessage = (template, fields) => {
        return template
            .replace('{name_unit}', fields.name_unit)
            .replace('{address_unit}', fields.address_unit || 'Endereço indisponível')
            .replace('{medic}', fields.medic || 'Médico não informado')
            .replace('{phone_unit}', fields.phone_unit || 'Contato indisponível')
            .replace('{schedule}', fields.schedule);
    };
    const messageLink = (message, phone_unit) => {
        const messageLink = message;
        const encodedMessage = encodeURIComponent(messageLink);
        return `https://api.whatsapp.com/send?phone=${phone_unit}&text=${encodedMessage}`;
    };
    if (message.hasMedia) {
        await (0, util_1.stateTyping)(message);
        client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos, apenas digite \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.');
        return;
    }
    if (chat.interaction_seq == 1) {
        const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields);
        const answer = await (0, IdentifyAnswer_1.interpretAnswer)(message.body);
        if (answer == 1) {
            await (0, util_1.stateTyping)(message);
            try {
                const response1schedule = await Response_1.default.query()
                    .select('message')
                    .where('local', 'response1schedule')
                    .andWhere('inactive', false)
                    .first();
                const defaultMessage = `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chatOtherFields.phone_unit}.`;
                const response1message = response1schedule
                    ? formatMessage(response1schedule.message, chatOtherFields)
                    : defaultMessage;
                await client.sendMessage(message.from, response1message);
                await Talk_1.default.create({
                    cellphone: message.from,
                    chatnumber: message.to,
                    message: response1message.slice(0, 999),
                    type: "to"
                });
                Object.assign(chat, {
                    response: message.body.slice(0, 500),
                    returned: true,
                    absoluteresp: 1,
                    externalstatus: 'A',
                    company_id: chat.shippingcampaign.company_id,
                });
                await chat.save();
            }
            catch (error) {
                console.error("Erro ao enviar a mensagem de agendamento:", error.message, error.stack);
            }
        }
        else if (answer == 2) {
            try {
                Object.assign(chat, {
                    response: message.body,
                    absoluteresp: 2,
                    externalstatus: 'A',
                    company_id: chat.shippingcampaign.company_id
                });
=======
const DatasourcesController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/DatasourcesController"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
exports.default = async (client, message, chat) => {
    if (chat.interaction_seq == 1) {
        const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields);
        if (await (0, util_1.PositiveResponse)(message.body)) {
            await (0, util_1.stateTyping)(message);
            try {
                client.sendMessage(message.from, `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp 3132350003.`);
                chat.response = message.body.slice(0, 500);
                chat.returned = true;
                chat.absoluteresp = 1;
                await chat.save();
            }
            catch (error) {
                console.log("Erro 454:", error);
            }
            const datasourcesController = new DatasourcesController_1.default;
            await datasourcesController.confirmSchedule(chat, chatOtherFields);
        }
        else if (await (0, util_1.NegativeResponse)(message.body)) {
            chat.response = message.body;
            chat.absoluteresp = 2;
            try {
>>>>>>> development
                await chat.save();
            }
            catch (error) {
                console.log("Erro 121:", error);
            }
<<<<<<< HEAD
            await (0, util_1.stateTyping)(message);
            try {
                const response2schedule = await Response_1.default.query()
                    .select('message')
                    .where('local', 'response2schedule')
                    .andWhere('inactive', false)
                    .first();
                const default2Message = `Entendi 😉, sabemos que nosso dia está muito atarefado! Sua consulta foi desmarcada, se deseja reagendar, clique no link que estou enviando para conversar com uma de nossas atendentes e podermos agendar novo horário mais conveniente para você.`;
                const message2 = response2schedule ? formatMessage(response2schedule.message, chatOtherFields) : default2Message;
                await client.sendMessage(message.from, message2);
                await Talk_1.default.create({
                    cellphone: message.from,
                    chatnumber: message.to,
                    message: message2.slice(0, 999),
                    type: "to"
                });
                const response2schedule2 = await Response_1.default.query()
                    .where('local', 'response2schedule2')
                    .first();
                if (response2schedule2) {
                    if (response2schedule2.inactive === false) {
                        const linkRedirect = messageLink(response2schedule2.message, chatOtherFields.phone_unit);
                        await client.sendMessage(message.from, linkRedirect);
                        await Talk_1.default.create({
                            cellphone: message.from,
                            chatnumber: message.to,
                            message: linkRedirect.slice(0, 999),
                            type: "to"
                        });
                    }
                }
                else if (!response2schedule2) {
                    const messageLink = `Olá, sou ${chat.name} e gostaria de reagendar uma consulta com ${chatOtherFields.medic}.`;
                    const encodedMessage = encodeURIComponent(messageLink);
                    const linkRedirect = `https://api.whatsapp.com/send?phone=${chat.shippingcampaign.phone_unit}&text=${encodedMessage}`;
                    await client.sendMessage(message.from, linkRedirect);
                    await Talk_1.default.create({
                        cellphone: message.from,
                        chatnumber: message.to,
                        message: linkRedirect.slice(0, 999),
                        type: "to"
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
                    cellphoneserialized: message.from,
                    shippingcampaigns_id: chat.shippingcampaigns_id,
                    message: message2.slice(0, 348),
                    response: "Reagendada",
                    returned: true,
                    company_id: chat.shippingcampaign.company_id
                });
                await Chat_1.default.create(chat2);
=======
            const datasourcesController = new DatasourcesController_1.default;
            await datasourcesController.cancelSchedule(chat, chatOtherFields);
            await (0, util_1.stateTyping)(message);
            const message2 = `Entendi 😉, sabemos que nosso dia está muito atarefado! Sua consulta foi desmarcada, se deseja reagendar, clique no link que estou enviando para conversar com uma de nossas atendentes e podermos agendar novo horário mais conveniente para você.`;
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
>>>>>>> development
            }
            catch (error) {
                console.log("Erro:", error);
            }
        }
<<<<<<< HEAD
        else if (answer == 3) {
            await (0, util_1.stateTyping)(message);
            try {
                const defaultMessage = `Desculpe pelo engano, vou pedir para corrigir nosso cadastro.`;
                await client.sendMessage(message.from, defaultMessage);
                await Talk_1.default.create({
                    cellphone: message.from,
                    chatnumber: message.to,
                    message: defaultMessage.slice(0, 999),
                    type: "to"
                });
            }
            catch (error) {
                console.error("Erro ao enviar a mensagem de agendamento:", error.message, error.stack);
            }
        }
        else {
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, 'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.');
            await Talk_1.default.create({
                cellphone: message.from,
                chatnumber: message.to,
                message: 'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.',
                type: "to"
            });
=======
        else {
            await (0, util_1.stateTyping)(message);
            client.sendMessage(message.from, 'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.');
>>>>>>> development
        }
    }
};
//# sourceMappingURL=ConfirmSchedule.js.map