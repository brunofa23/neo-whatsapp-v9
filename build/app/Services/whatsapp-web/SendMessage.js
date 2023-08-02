"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
global.executingSendMessage = false;
const timeExecuteSendMessage = process.env.EXECUTE_SEND_MESSAGE;
exports.default = async (client, shippingCampaignList) => {
    async function sendMessages() {
        for (const dataRow of shippingCampaignList) {
            global.executingSendMessage = true;
            try {
                await new Promise(resolve => setTimeout(resolve, timeExecuteSendMessage));
                if (dataRow.phonevalid && !dataRow.messagesent) {
                    await client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
                        .then(async (response) => {
                        dataRow.messagesent = true;
                        dataRow.save();
                    }).catch((error) => {
                        console.log("ERRRRO:::", error);
                    });
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
                    console.log("Mensagem enviada:", dataRow.name, "cellphone", dataRow.cellphoneserialized, "phonevalid", dataRow.phonevalid);
                }
            }
            catch (error) {
                console.log("ERRO:::", error);
            }
        }
        global.executingSendMessage = false;
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessage.js.map