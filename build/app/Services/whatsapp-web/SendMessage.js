"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShippingcampaignsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ShippingcampaignsController"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
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
    }
    async function verifyContSend() {
        if (global.contSend >= 3) {
            if (resetContSendBool == false) {
                resetContSend = luxon_1.DateTime.local().plus({ minutes: 6 });
                resetContSendBool = true;
            }
            else if (resetContSend <= luxon_1.DateTime.local()) {
                resetContSendBool = false;
                global.contSend = 0;
            }
        }
    }
    async function countLimitSendMessage() {
        const value = await shippingcampaignsController.maxLimitSendMessage(agent);
        return value;
    }
    async function maxLimitSendMessageAgent(id) {
        const agentMaxLimitSend = await Agent_1.default.query().where('id', id).first();
        if (agentMaxLimitSend == undefined || agentMaxLimitSend?.max_limit_message == undefined)
            return 0;
        return agentMaxLimitSend?.max_limit_message;
    }
    async function sendMessages() {
        const totMessageSend = await countLimitSendMessage();
        const maxLimitSendAgent = await maxLimitSendMessageAgent(agent.id);
        const shippingCampaign = await shippingcampaignsController.patientToSend(agent);
        let verifyChat;
        let verifycontsend;
        console.log("**PASSO 1 - GLOBAL_CONT(Total de clientes enviados aguardando resposta max3)", global.contSend);
        console.log(`**PASSO 2 - total de mensagens enviadas do cliente:${client?.info?.wid.user}`, totMessageSend);
        console.log(`**PASSO 3 - Verifica shippingCampaign(se tem algum paciente para enviar)`, shippingCampaign?.cellphone);
        if (totMessageSend >= maxLimitSendAgent && (shippingCampaign?.prioritysend == null || shippingCampaign?.prioritysend == undefined)) {
            console.log(`LIMITE DIÁRIO ATINGIDO,Id:${agent.id} Agent: ${agent.name} Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendAgent}`);
            return;
        }
        if (await (0, util_1.TimeSchedule)() == false) {
            return;
        }
        await verifyContSend();
        if (shippingCampaign) {
            console.log("*** PASSO 4");
            if (global.contSend < 3) {
                if (global.contSend < 0)
                    global.contSend = 0;
                try {
                    console.log("*** PASSO 5");
                    if (!shippingCampaign.prioritysend)
                        verifycontsend = await verifyClientSend(client, shippingCampaign?.cellphone);
                    if (verifycontsend)
                        return;
                    console.log("*** PASSO 5.1");
                    const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, shippingCampaign?.cellphone);
                    console.log("*** PASSO 5.2");
                    if (validationCellPhone) {
                        console.log("*** PASSO 5.3");
                        verifyChat = await Chat_1.default.query()
                            .where('interaction_id', shippingCampaign?.interaction_id)
                            .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
                            .andWhere('shippingcampaigns_id', shippingCampaign?.id).first();
                        if (verifyChat == undefined) {
                            console.log("*** PASSO 6");
                            let returnResponse = {};
                            await client.sendMessage(validationCellPhone, shippingCampaign.message)
                                .then(async (response) => {
                                console.log("*** PASSO 7");
                                returnResponse = response;
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
                                    chatname: agent.name,
                                    chatnumber: client.info.wid.user
                                };
                                await Chat_1.default.create(bodyChat);
                                await Talk_1.default.create({
                                    cellphone: await (0, util_1.extractCellphone)(shippingCampaign.cellphone),
                                    chatnumber: client.info.wid.user,
                                    message: shippingCampaign.message.slice(0, 999),
                                    type: "to"
                                });
                                console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "agent", agent.name);
                                if (agent.statusconnected == false || agent.status !== 'CONNECTED')
                                    await Agent_1.default.query().where('id', agent.id).update({ statusconnected: true, status: 'CONNECTED' });
                            }).catch(async (error) => {
                                console.log("*** PASSO 8");
                                const state = await client.getState();
                                await Agent_1.default.query().where('id', agent.id).update({ statusconnected: false, status: state });
                                await Log_1.default.create({ name: 'sendMessage', message: error, description: "SendMessage.ts. linha:120 - Whatsapp Bugado catch" });
                            });
                            if (Object.keys(returnResponse).length === 0) {
                                console.log("*** PASSO 9");
                                await Log_1.default.create({ name: 'sendMessage', message: error, description: "SendMessage.ts. linha:120 - Whatsapp Bugado depois deo catch" });
                                await Agent_1.default.query().where('id', agent.id).update({ statusconnected: false });
                            }
                        }
                    }
                    else {
                        shippingCampaign.phonevalid = false;
                        const result = await shippingCampaign.save();
                        console.log(`*** PASSO 10: id:${result.id}, nome:${result.name}, fone:${result.cellphone}, phonevalid:${result.phonevalid}`);
                    }
                }
                catch (error) {
                    console.log("ERRO 1500:::", error);
                    await Log_1.default.create({ name: 'sendMessageGeneral', message: error, description: "SendMessage.ts. linha:131" });
                }
            }
        }
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map