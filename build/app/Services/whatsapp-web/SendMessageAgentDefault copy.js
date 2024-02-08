"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const VerifyNumber_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/VerifyNumber");
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
const util_1 = require("./util");
exports.default = async (client, agent) => {
    const startTimeSendMessage = agent.interval_init_message;
    const endTimeSendMessage = agent.interval_final_message;
    async function customChatSendMessage() {
        return await Customchat_1.default.query()
            .where('messagesent', 0)
            .andWhereNotNull('message')
            .andWhereNull('phonevalid').first();
    }
    async function sendMessages() {
        setInterval(async () => {
            const customChat = await customChatSendMessage();
            if (customChat) {
                const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, customChat?.cellphone);
                if (validationCellPhone == null) {
                    customChat.phonevalid = false;
                    await customChat.save();
                }
                if (validationCellPhone) {
                    await client.sendMessage(validationCellPhone, customChat?.message)
                        .then(async (response) => {
                        customChat.messagesent = true;
                        customChat.cellphoneserialized = validationCellPhone;
                        customChat.chatname = agent.name;
                        customChat.chatnumber = client.info.wid.user;
                        customChat.phonevalid = true;
                        await customChat.save();
                    }).catch(async (error) => {
                        console.log("ERRO 1452:::", error);
                    });
                    await Agent_1.default.query().where('id', agent.id).update({ statusconnected: true });
                }
            }
        }, await (0, util_1.GenerateRandomTime)(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'));
    }
    await sendMessages();
    return client;
};
//# sourceMappingURL=SendMessageAgentDefault%20copy.js.map