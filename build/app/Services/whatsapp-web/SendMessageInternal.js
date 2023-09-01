"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const VerifyNumber_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/VerifyNumber");
const util_1 = require("./util");
const ListInternalPhrases_1 = __importDefault(require("./ListInternalPhrases"));
const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE);
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END);
async function PhoneInternal() {
    const list_phone_talking = process.env.LIST_PHONES_TALK;
    const list_phones = list_phone_talking?.split(",");
    if (list_phones?.length >= 0) {
        const phone = list_phones[Math.floor(Math.random() * list_phones?.length)];
        console.log("List phones:", phone);
        return phone;
    }
}
exports.default = async (client) => {
    async function sendMessages() {
        if (await (0, util_1.TimeSchedule)() == false) {
            return;
        }
        const phrase = await (0, ListInternalPhrases_1.default)();
        const phone = await PhoneInternal();
        const validationCellPhone = await (0, VerifyNumber_1.verifyNumber)(client, phone);
        try {
            await client.sendMessage(validationCellPhone, phrase)
                .then(async (response) => {
            }).catch(async (error) => {
            });
        }
        catch (error) {
            console.log("ERRO:::", error);
        }
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessageInternal.js.map