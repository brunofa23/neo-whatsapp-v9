"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const VerifyNumber_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/VerifyNumber");
const moment = require("moment");
const util_1 = require("./util");
const luxon_1 = require("luxon");
const ShippingcampaignsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ShippingcampaignsController"));
global.contSend = 0;
const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE);
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END);
exports.default = async (client) => {
    let resetContSend = luxon_1.DateTime.local();
    let resetContSendBool = false;
    async function _shippingCampaignList() {
        return await Shippingcampaign_1.default.query()
            .whereNull('phonevalid')
            .andWhere('created_at', '>=', yesterday).first();
    }
    async function verifyContSend() {
        if (global.contSend >= 3) {
            if (resetContSendBool == false) {
                resetContSend = luxon_1.DateTime.local().plus({ minutes: 4 });
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
        const value = await shippingcampaignsController.maxLimitSendMessage();
        return value;
    }
    const maxLimitSendMessage = parseInt(process.env.MAX_LIMIT_SEND_MESSAGE);
    async function sendMessages() {
        setInterval(async () => {
            const totMessageSend = await countLimitSendMessage();
            if (totMessageSend >= maxLimitSendMessage) {
                console.log(`LIMITE DE ENVIO DIÁRIO ATINGIDO, Enviados:${totMessageSend} Limite Máximo:${maxLimitSendMessage}`);
                return;
            }
            if (await !(0, util_1.TimeSchedule)())
                return;
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
                                    chatname: process.env.CHAT_NAME
                                };
                                await Chat_1.default.create(bodyChat);
                                console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "phonevalid", shippingCampaign.phonevalid);
                            }).catch(async (error) => {
                                console.log("ERRRRO:::", error);
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