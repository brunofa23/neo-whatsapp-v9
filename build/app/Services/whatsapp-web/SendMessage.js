"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShippingcampaignsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ShippingcampaignsController"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
<<<<<<< HEAD
const VerifyNumber_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/VerifyNumber");
const luxon_1 = require("luxon");
const util_1 = require("./util");
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
global.contSend = 0;
const dayBefore5 = luxon_1.DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00');
let resetContSend = luxon_1.DateTime.local();
let resetContSendBool = false;
const shippingcampaignsController = new ShippingcampaignsController_1.default();
exports.default = async (client, agent) => {
    async function verifyClientSend(client, cellphone) {
        if (client?.info?.wid) {
            const query = Chat_1.default.query()
                .where('cellphone', cellphone)
                .andWhere('created_at', '>', dayBefore5)
                .andWhere('chatnumber', client.info.wid.user);
            return await query.first();
        }
        else {
            console.log("cliente não conectado");
            return;
        }
=======
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const VerifyNumber_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/VerifyNumber");
const luxon_1 = require("luxon");
const util_1 = require("./util");
global.contSend = 0;
const yesterday = luxon_1.DateTime.local().toFormat('yyyy-MM-dd 00:00');
let startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE);
let endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END);
exports.default = async (client) => {
    let resetContSend = luxon_1.DateTime.local();
    let resetContSendBool = false;
    async function getAgent(chatName) {
        const agent = await Agent_1.default.findBy('name', chatName);
        if (!agent || agent == undefined) {
            console.log("Erro: Verifique o chatnumer");
            return;
        }
        startTimeSendMessage = agent.interval_init_message;
        endTimeSendMessage = agent.interval_final_message;
        return agent;
    }
    async function _shippingCampaignList() {
        return await Shippingcampaign_1.default.query()
            .whereNull('phonevalid')
            .andWhere('created_at', '>', yesterday).first();
>>>>>>> development
    }
    async function verifyContSend() {
        if (global.contSend >= 3) {
            if (resetContSendBool == false) {
<<<<<<< HEAD
                resetContSend = luxon_1.DateTime.local().plus({ minutes: 4 });
=======
                resetContSend = luxon_1.DateTime.local().plus({ minutes: 5 });
>>>>>>> development
                resetContSendBool = true;
            }
            else if (resetContSend <= luxon_1.DateTime.local()) {
                resetContSendBool = false;
                global.contSend = 0;
            }
        }
    }
    async function countLimitSendMessage() {
<<<<<<< HEAD
        const value = await shippingcampaignsController.maxLimitSendMessage(agent);
        return value;
    }
    async function maxLimitSendMessageAgent(id) {
        const agentMaxLimitSend = await Agent_1.default.query().where('id', id).first();
        if (agentMaxLimitSend == undefined || agentMaxLimitSend?.max_limit_message == undefined)
            return 0;
        return agentMaxLimitSend?.max_limit_message;
    }
    async function VerifyChat(shippingCampaign) {
        const query = Chat_1.default.query()
            .where('interaction_id', shippingCampaign?.interaction_id)
            .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
            .andWhere('shippingcampaigns_id', shippingCampaign?.id);
        return await query.first();
    }
    async function sendMessages() {
        const totMessageSend = await countLimitSendMessage();
        const maxLimitSendAgent = await maxLimitSendMessageAgent(agent.id);
        const shippingCampaign = await shippingcampaignsController.patientToSend(agent);
        let verifyChat;
        let verifycontsend;
        if (totMessageSend >= maxLimitSendAgent && (shippingCampaign?.prioritysend == null || shippingCampaign?.prioritysend == undefined || shippingCampaign?.prioritysend == false)) {
            console.log(`LIMITE DIÁRIO ATINGIDO,Id:${agent.id} Agent: ${agent.name} Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendAgent}`);
            return;
        }
        if (await (0, util_1.TimeSchedule)() == false) {
            return;
        }
        await verifyContSend();
        if (shippingCampaign) {
            if (global.contSend <= 3) {
                if (global.contSend < 0)
                    global.contSend = 0;
                try {
                    if (!shippingCampaign.prioritysend)
                        verifycontsend = await verifyClientSend(client, shippingCampaign?.cellphone);
                    if (verifycontsend)
                        return;
                    const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, shippingCampaign?.cellphone);
                    if (validationCellPhone === 'INVALID') {
                        shippingCampaign.phonevalid = false;
                        await shippingCampaign.save();
                        return;
                    }
                    else if (validationCellPhone === null) {
                        console.log("Erro Temporário, repetir:", shippingCampaign.cellphone);
                    }
                    else {
                        verifyChat = await VerifyChat(shippingCampaign);
                        if (verifyChat == undefined) {
                            let returnResponse = {};
                            await client.sendMessage(validationCellPhone, shippingCampaign.message)
                                .then(async (response) => {
                                returnResponse = response;
=======
        const shippingcampaignsController = new ShippingcampaignsController_1.default();
        const value = await shippingcampaignsController.maxLimitSendMessage();
        return value;
    }
    async function sendMessages() {
        setInterval(async () => {
            const agent = await getAgent(process.env.CHAT_NAME);
            const totMessageSend = await countLimitSendMessage();
            if (totMessageSend >= agent.max_limit_message) {
                console.log(`LIMITE DE ENVIO DIÁRIO ATINGIDO, Enviados:${totMessageSend} - Limite Máximo:${agent.max_limit_message}`);
                return;
            }
            if (await (0, util_1.TimeSchedule)() == false) {
                return;
            }
            await verifyContSend();
            const shippingCampaign = await _shippingCampaignList();
            if (shippingCampaign) {
                if (global.contSend < 3) {
                    if (global.contSend < 0)
                        global.contSend = 0;
                    try {
                        const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, shippingCampaign?.cellphone);
                        console.log(`VALIDAÇÃO DE TELEFONE DO PACIENTE:${shippingCampaign?.name}:`, validationCellPhone);
                        if (validationCellPhone) {
                            await client.sendMessage(validationCellPhone, shippingCampaign.message)
                                .then(async (response) => {
>>>>>>> development
                                global.contSend++;
                                shippingCampaign.messagesent = true;
                                shippingCampaign.phonevalid = true;
                                shippingCampaign.cellphoneserialized = validationCellPhone;
                                await shippingCampaign.save();
                                const bodyChat = {
                                    interaction_id: shippingCampaign.interaction_id,
                                    interaction_seq: shippingCampaign.interaction_seq,
                                    idexternal: shippingCampaign.idexternal,
                                    reg: shippingCampaign.reg,
                                    name: shippingCampaign.name,
                                    cellphone: shippingCampaign.cellphone,
                                    cellphoneserialized: shippingCampaign.cellphoneserialized,
                                    message: shippingCampaign.message,
                                    shippingcampaigns_id: shippingCampaign.id,
<<<<<<< HEAD
                                    chatname: agent.name,
                                    chatnumber: client.info.wid.user
                                };
                                const chat = await Chat_1.default.create(bodyChat);
                                await Talk_1.default.create({
                                    cellphone: validationCellPhone,
                                    chatnumber: client.info.wid._serialized,
                                    reg: shippingCampaign.reg,
                                    chat_id: chat.id,
                                    message: shippingCampaign.message.slice(0, 999),
                                    type: "to"
                                });
                                console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "agent", agent.name);
                                if (agent.statusconnected == false || agent.status !== 'CONNECTED')
                                    await Agent_1.default.query().where('id', agent.id).update({ statusconnected: true, status: 'CONNECTED' });
                            }).catch(async (error) => {
                                const state = await client.getState();
                                await Agent_1.default.query().where('id', agent.id).update({ statusconnected: false, status: state });
                                await Log_1.default.create({ name: 'sendMessage', message: error, description: "SendMessage.ts. linha:120 - Whatsapp Bugado catch" });
                            });
                            if (returnResponse && Object.keys(returnResponse).length === 0) {
                                await Log_1.default.create({ name: 'sendMessage', message: error, description: "SendMessage.ts. linha:120 - Whatsapp Bugado depois deo catch" });
                                await Agent_1.default.query().where('id', agent.id).update({ statusconnected: false });
                            }
                        }
                    }
                }
                catch (error) {
                    await Log_1.default.create({ name: 'sendMessageGeneral', message: "error", description: "SendMessage.ts. linha:131" });
                }
            }
        }
=======
                                    chatname: process.env.CHAT_NAME
                                };
                                await Chat_1.default.create(bodyChat);
                                console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "phonevalid", shippingCampaign.phonevalid);
                            }).catch(async (error) => {
                                console.log("ERRO 1452:::", error);
                            });
                        }
                        else {
                            shippingCampaign.phonevalid = false;
                            await shippingCampaign.save();
                        }
                    }
                    catch (error) {
                        console.log("ERRO:::", error);
                    }
                }
            }
        }, await (0, util_1.GenerateRandomTime)(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'));
>>>>>>> development
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map