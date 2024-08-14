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
global.contSend = 0;
const dayBefore5 = luxon_1.DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00');
let resetContSend = luxon_1.DateTime.local();
let resetContSendBool = false;
const shippingcampaignsController = new ShippingcampaignsController_1.default();
exports.default = async (client, agent) => {
    async function verifyClientSend(client, cellphone) {
        if (client?.info?.wid) {
            return await Chat_1.default.query()
                .where('cellphone', cellphone)
                .andWhere('created_at', '>', dayBefore5)
                .andWhere('chatnumber', client.info.wid.user).first();
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
        if (totMessageSend >= maxLimitSendAgent && (shippingCampaign?.prioritysend == null || shippingCampaign?.prioritysend == undefined)) {
            console.log(`LIMITE DIÁRIO ATINGIDO, Agent: ${agent.name} Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendAgent}`);
            return;
        }
        if (await (0, util_1.TimeSchedule)() == false) {
            return;
        }
        await verifyContSend();
        if (shippingCampaign) {
            if (global.contSend < 3) {
                if (global.contSend < 0)
                    global.contSend = 0;
                try {
                    if (!shippingCampaign.prioritysend)
                        verifycontsend = await verifyClientSend(client, shippingCampaign?.cellphone);
                    if (verifycontsend)
                        return;
                    const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, shippingCampaign?.cellphone);
                    if (validationCellPhone) {
                        verifyChat = await Chat_1.default.query()
                            .where('interaction_id', shippingCampaign?.interaction_id)
                            .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
                            .andWhere('shippingcampaigns_id', shippingCampaign?.id).first();
                        if (verifyChat == undefined) {
                            await client.sendMessage(validationCellPhone, shippingCampaign.message)
                                .then(async (response) => {
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
                                console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "agent", agent.name);
                                if (agent.statusconnected == false)
                                    await Agent_1.default.query().where('id', agent.id).update({ statusconnected: true });
                            }).catch(async (error) => {
                                console.log("ERRO 1452:::", error);
                            });
                        }
                    }
                    else {
                        shippingCampaign.phonevalid = false;
                        await shippingCampaign.save();
                    }
                }
                catch (error) {
                    console.log("ERRO 1500:::", error);
                }
            }
        }
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map