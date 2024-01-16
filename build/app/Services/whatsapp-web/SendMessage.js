"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShippingcampaignsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ShippingcampaignsController"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Interaction_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Interaction"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const VerifyNumber_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/VerifyNumber");
const luxon_1 = require("luxon");
const util_1 = require("./util");
global.contSend = 0;
const yesterday = luxon_1.DateTime.local().toFormat('yyyy-MM-dd 00:00');
exports.default = async (client, agent) => {
    let resetContSend = luxon_1.DateTime.local();
    let resetContSendBool = false;
    const startTimeSendMessage = agent.interval_init_message;
    const endTimeSendMessage = agent.interval_final_message;
    async function _shippingCampaignList() {
        return await Shippingcampaign_1.default.query()
            .whereNull('phonevalid')
            .andWhere('messagesent', 0)
            .andWhere('created_at', '>', yesterday).orderBy(['interaction_id', 'created_at']).first();
    }
    async function verifyContSend() {
        if (global.contSend >= 3) {
            if (resetContSendBool == false) {
                resetContSend = luxon_1.DateTime.local().plus({ minutes: 5 });
                resetContSendBool = true;
            }
            else if (resetContSend <= luxon_1.DateTime.local()) {
                resetContSendBool = false;
                global.contSend = 0;
            }
        }
    }
    async function countLimitSendMessage() {
        const shippingcampaignsController = new ShippingcampaignsController_1.default();
        const value = await shippingcampaignsController.maxLimitSendMessage(agent);
        return value;
    }
    async function maxLimitSendMessageAgent(id) {
        const agentMaxLimitSend = await Agent_1.default.query().where('id', id).first();
        if (agentMaxLimitSend == undefined || agentMaxLimitSend?.max_limit_message == undefined)
            return 0;
        return agentMaxLimitSend?.max_limit_message;
    }
    async function totalInteractionSend(id) {
        const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
        const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
        try {
            const maxsendlimit = await Interaction_1.default.query().select('maxsendlimit').where("id", id).first();
            const totalSend = await Chat_1.default.query()
                .where('interaction_id', id)
                .andWhereBetween('created_at', [dateStart, dateEnd])
                .count('* as total').first();
            if (totalSend?.$extras.total < maxsendlimit.maxsendlimit || maxsendlimit == null)
                return false;
            else
                return true;
        }
        catch (error) {
            throw error;
        }
    }
    async function sendMessages() {
        setInterval(async () => {
            await Agent_1.default.query().where('id', agent.id).update({ statusconnected: true });
            const totMessageSend = await countLimitSendMessage();
            const maxLimitSendAgent = await maxLimitSendMessageAgent(agent.id);
            if (totMessageSend >= maxLimitSendAgent) {
                console.log(`LIMITE DIÁRIO ATINGIDO, Agent: ${agent.name} Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendAgent}`);
                return;
            }
            if (await (0, util_1.TimeSchedule)() == false) {
                return;
            }
            await verifyContSend();
            const shippingCampaign = await _shippingCampaignList();
            const verifyChat = await Chat_1.default.query()
                .where('interaction_id', shippingCampaign?.interaction_id)
                .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
                .andWhere('shippingcampaigns_id', shippingCampaign?.id).first();
            if (verifyChat) {
                return;
            }
            if (shippingCampaign?.interaction_id) {
                if (await totalInteractionSend(shippingCampaign?.interaction_id)) {
                    console.log("Limite de Interação atingida...");
                    return;
                }
            }
            if (shippingCampaign) {
                if (global.contSend < 3) {
                    if (global.contSend < 0)
                        global.contSend = 0;
                    try {
                        const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, shippingCampaign?.cellphone);
                        if (validationCellPhone) {
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
                                    chatname: agent.name
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
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map