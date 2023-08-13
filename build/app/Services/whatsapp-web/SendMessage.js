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
global.contSend = 0;
let resetContSend = luxon_1.DateTime.local();
let resetContSendBool = false;
const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE);
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END);
exports.default = async (client) => {
    async function _shippingCampaignList() {
        console.log("2 - PASSANDO PELO SHIPPING CAMPAIN");
        return await Shippingcampaign_1.default.query()
            .whereNull('phonevalid')
            .andWhere('created_at', '>=', yesterday).first();
    }
    async function sendMessages() {
        setInterval(async () => {
            console.log("1 - ENTREI NO SEND MESSAGES...");
            if (await !(0, util_1.TimeSchedule)())
                return;
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
            const shippingCampaign = await _shippingCampaignList();
            if (shippingCampaign) {
                if (global.contSend < 3) {
                    if (global.contSend < 0)
                        global.contSend = 0;
                    try {
                        const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, shippingCampaign?.cellphone);
                        console.log(`3 - VALIDAÇÃO DE TELEFONE DO PACIENTE:${shippingCampaign?.name}:`, validationCellPhone);
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
            console.log("4 - SAI DO SEND MESSAGES...");
        }, await (0, util_1.GenerateRandomTime)(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'));
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map