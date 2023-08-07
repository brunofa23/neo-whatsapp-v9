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
let monitoringContSend = 0;
exports.default = async (client) => {
    async function sendMessages() {
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        const shippingCampaignList = await Shippingcampaign_1.default.query().whereNull('phonevalid')
            .andWhere('created_at', '>=', yesterday)
            .whereNull('messagesent')
            .orWhere('messagesent', '=', 0)
            .whereNotNull('cellphone');
        const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
        const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
        const maxLimitSendMessage = await Shippingcampaign_1.default.query()
            .where('messagesent', '=', '1')
            .andWhereBetween('created_at', [dateStart, dateEnd]);
        console.log("TOTAL DE MSG ENVIADAS", maxLimitSendMessage.length);
        if (maxLimitSendMessage.length >= parseInt(process.env.MAX_LIMIT_SEND_MESSAGE)) {
            console.log("LIMITE ATINGIDO DE ENVIOS");
            return;
        }
        for (const dataRow of shippingCampaignList) {
            const time = await (0, util_1.GenerateRandomTime)(15, 30);
            global.executingSendMessage = true;
            monitoringContSend++;
            if (monitoringContSend >= 20) {
                global.contSent = 0;
            }
            if (global.contSend < 3) {
                if (global.contSend < 0)
                    global.contSend = 0;
                console.log("valor do contSend", global.contSend);
                try {
                    const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, dataRow.cellphone);
                    console.log(`VALIDAÇÃO DE TELEFONE DO PACIENTE:${dataRow.name}:`, validationCellPhone);
                    global.contSend++;
                    if (validationCellPhone) {
                        await client.sendMessage(validationCellPhone, dataRow.message)
                            .then(async (response) => {
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
                }
                catch (error) {
                    console.log("ERRO:::", error);
                }
            }
        }
        console.log("Aguardando resposta:", global.contSend, " Total de vezes:", monitoringContSend);
        global.executingSendMessage = false;
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map