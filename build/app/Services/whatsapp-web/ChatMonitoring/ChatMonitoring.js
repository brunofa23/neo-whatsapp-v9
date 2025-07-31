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
async function verifyNumberInternal(phoneVerify) {
    const listPhonesFromEnv = process.env.LIST_PHONES_TALK?.split(",") || [];
    if (listPhonesFromEnv.includes(phoneVerify)) {
        return true;
    }
    const connectedAgents = await Agent_1.default.query()
        .select('number_phone')
        .whereNull('deleted')
        .andWhere('status', 'CONNECTED');
    const isPhoneInAgents = connectedAgents.some(agent => agent.number_phone === phoneVerify);
    return isPhoneInAgents;
}
async function getCustomChat(cellphone, chatnumber) {
    chatnumber = chatnumber.replace(/@.*$/, '');
    const query = Customchat_1.default.query()
        .where('cellphoneserialized', cellphone)
        .andWhere('chatnumber', chatnumber)
        .andWhereNull('returned')
        .orderBy('created_at', 'desc');
    const customChat = await query.first();
    return customChat;
}
async function getChat(cellphone, agentPhone) {
    const match = agentPhone.match(/\d/g);
    const phoneAgent = match ? match.join('') : '';
    return await Chat_1.default.query()
        .preload('shippingcampaign')
        .where('cellphoneserialized', cellphone)
        .andWhere('chatnumber', phoneAgent)
        .orderBy('created_at', 'desc')
        .whereNull('response').first();
}
class Monitoring {
    async monitoring(client) {
        try {
            client.on('message', async (message) => {
                if (await shouldIgnoreMessage(message))
                    return;
                const isInternalNumber = await verifyNumberInternal(message.from);
                if (isInternalNumber) {
                    console.log("Número interno:", message.from);
                    return;
                }
                const customChat = await getCustomChat(message.from, client.info.wid.user);
                if (customChat) {
                    await handleCustomChatMessage(message, customChat);
                    return;
                }
                if (message.hasMedia) {
                    await (0, util_1.stateTyping)(message);
                    client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!');
                    return;
                }
                const chat = await getChat(message.from, message.to);
                if (chat) {
                    await handleChatMessage(client, message, chat);
                    return;
                }
                await handleNewMessage(client, message);
            });
        }
        catch (error) {
            console.error("Erro no monitoramento:", error);
        }
    }
}
exports.default = Monitoring;
function shouldIgnoreMessage(message) {
    const isE2ENotification = message.type?.toLowerCase() === "e2e_notification";
    const isEmptyMessage = message.body === "" && !message.hasMedia;
    const isGroupMessage = message.from?.includes("@g.us");
    const isBroadcastMessage = message.from?.includes("@broadcast");
    const isStatusMessage = message.from?.includes("@status");
    const isNotFromIndividual = !message.from?.includes("@c.us");
    return isE2ENotification || isEmptyMessage || isGroupMessage || isBroadcastMessage || isStatusMessage || isNotFromIndividual;
}
async function handleCustomChatMessage(message, customChat) {
    let pathMedia = "";
    if (message.hasMedia) {
        const media = await message.downloadMedia();
        const midias = new MidiasController_1.default();
        const fileName = `${customChat.chats_id}_${Date.now()}`;
        pathMedia = await midias.storeMedia(media, fileName, "Customchats");
        message.body = " ";
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
    await Chat_1.default.query().where('id', customChat.chats_id).update({ date_return: luxon_1.DateTime.now().toFormat("yyyy-MM-dd HH:mm"), last_response: 2 });
    await Talk_1.default.create({
        chat_id: customChat.chats_id,
        reg: customChat.reg,
        cellphone: message.from,
        chatnumber: message.to,
        message_ack: message.ack,
        message: message.body.slice(0, 999),
        type: "from"
    });
}
async function handleChatMessage(client, message, chat) {
    await Talk_1.default.create({
        chat_id: chat.id,
        reg: chat.reg,
        cellphone: message.from,
        chatnumber: message.to,
        message_ack: message.ack,
        message: message.body.slice(0, 999),
        type: "from"
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
async function handleNewMessage(client, message) {
    try {
        await Talk_1.default.create({
            cellphone: message.from,
            chatnumber: message.to,
            message_ack: message.ack,
            message: message.body.slice(0, 999),
            type: "from"
        });
        const query = await Shippingcampaign_1.default.query()
            .where('cellphoneserialized', message.from)
            .where('interaction_id', 1)
            .select('otherfields', 'name');
        const queryTalk = await Talk_1.default.query()
            .where('cellphone', message.from)
            .andWhere('chatnumber', message.to);
        const context = query.map((item) => `name:${item.name} \n${item.otherfields}`).join("\n");
        const contextTalk = queryTalk.map((item) => item.message).join("\n");
        const fullContext = context + '\n\n' + contextTalk;
        const response = await (0, aiResponder_1.responderPergunta)(message.body, fullContext);
        if (response) {
            await (0, util_1.stateTyping)(message);
            await client.sendMessage(message.from, response);
            await Talk_1.default.create({
                cellphone: message.from,
                chatnumber: message.to,
                message_ack: message.ack,
                message: response.slice(0, 999),
                type: "to"
            });
        }
        else {
            await sendRandomFinalMessage(client, message);
        }
    }
    catch (error) {
        console.error("Erro ao processar mensagem:", error);
        await client.sendMessage(message.from, "Desculpe, ocorreu um erro ao processar sua mensagem.");
    }
}
async function sendRandomFinalMessage(client, message) {
    let responseArray;
    const responsesChatfinish = await Response_1.default.query().select('message')
        .where('local', 'chatfinish');
    if (responsesChatfinish.length > 0)
        responseArray = responsesChatfinish.map(response => response.message);
    else
        responseArray = [
            "Desculpe, mas esta conversa já foi finalizada. O Neo Agradece por sua compreensão, para maiores esclarecimentos ligue para 31-32350003.",
            "Infelizmente esta conversa já foi finalizada. O Neo Agradece por sua interação! Maiores esclarecimentos ligue para 31-32350003.",
            "Olá, sou apenas uma atendente virtual, para maiores esclarecimentos ligue para 31-32350003.",
            "Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi finalizada. Para maiores esclarecimentos ligue para 31-32350003. O Neo Agradece!",
        ];
    const randomMessage = await (0, util_1.RandomResponse)(responseArray);
    await (0, util_1.stateTyping)(message);
    client.sendMessage(message.from, randomMessage);
}
//# sourceMappingURL=ChatMonitoring.js.map