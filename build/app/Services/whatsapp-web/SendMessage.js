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
global.executingSendMessage = false;
global.contSend = 0;
let resetContSend = luxon_1.DateTime.local();
let resetContSendBool = false;
const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE);
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END);
exports.default = async (client) => {
    async function sendMessages() {
        setInterval(async () => {
            if (await !(0, util_1.TimeSchedule)())
                return;
            const shippingCampaignList = await Shippingcampaign_1.default.query()
                .whereNull('phonevalid')
                .andWhere('created_at', '>=', yesterday);
            const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
            const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
            const maxLimitSendMessage = await Shippingcampaign_1.default.query()
                .where('messagesent', '=', '1')
                .andWhereBetween('created_at', [dateStart, dateEnd]);
            if (maxLimitSendMessage.length >= parseInt(process.env.MAX_LIMIT_SEND_MESSAGE)) {
                console.log(`LIMITE MÁXIMO DIÁRIO DE ENVIOS ATINGIDOS:${process.env.MAX_LIMIT_SEND_MESSAGE}`);
                return;
            }
            for (const dataRow of shippingCampaignList) {
                const time = await (0, util_1.GenerateRandomTime)(20, 30);
                global.executingSendMessage = true;
                if (global.contSend < 2) {
                    if (global.contSend < 0) {
                        global.contSend = 0;
                    }
                    try {
                        const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, dataRow.cellphone);
                        console.log(`VALIDAÇÃO DE TELEFONE DO PACIENTE:${dataRow.name}:`, validationCellPhone);
                        if (validationCellPhone) {
                            await client.sendMessage(validationCellPhone, dataRow.message)
                                .then(async (response) => {
                                global.contSend++;
                                dataRow.messagesent = true;
                                dataRow.phonevalid = true;
                                dataRow.cellphoneserialized = validationCellPhone;
                                dataRow.save();
                                const bodyChat = {
                                    interaction_id: dataRow.interaction_id,
                                    interaction_seq: dataRow.interaction_seq,
                                    idexternal: dataRow.idexternal,
                                    reg: dataRow.reg,
                                    name: dataRow.name,
                                    cellphone: dataRow.cellphone,
                                    cellphoneserialized: dataRow.cellphoneserialized,
                                    message: dataRow.message,
                                    shippingcampaigns_id: dataRow.id
                                };
                                await Chat_1.default.create(bodyChat);
                            }).catch((error) => {
                                console.log("ERRRRO:::", error);
                            });
                            await new Promise(resolve => setTimeout(resolve, time));
                            console.log("Mensagem enviada:", dataRow.name, "cellphone", dataRow.cellphoneserialized, "phonevalid", dataRow.phonevalid);
                        }
                        else {
                            dataRow.phonevalid = false;
                            dataRow.save();
                        }
                    }
                    catch (error) {
                        console.log("ERRO:::", error);
                    }
                }
                else if (global.contSend >= 3) {
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
            global.executingSendMessage = false;
        }, await (0, util_1.GenerateRandomTime)(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'));
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map