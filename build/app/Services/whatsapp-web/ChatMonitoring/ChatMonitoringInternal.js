"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const ListInternalPhrases_1 = __importDefault(require("../ListInternalPhrases"));
const util_1 = require("../util");
async function verifyNumberInternal(phoneVerify) {
    const list_phone_talking = process.env.LIST_PHONES_TALK;
    const list_phones = list_phone_talking?.split(",");
    for (const phone of list_phones) {
        if (phoneVerify === phone)
            return true;
    }
}
let dateSendMessageInternalUpdate = luxon_1.DateTime.local();
function timeRandom(min, max) {
    const time = Math.floor(Math.random() * (max - min + 1)) + min;
    return time;
}
class Monitoring {
    async monitoring(client) {
        try {
            client.on('message', async (message) => {
                if (await verifyNumberInternal(message.from)) {
                    if (dateSendMessageInternalUpdate <= luxon_1.DateTime.now()) {
                        const time = await timeRandom(500, 800);
                        dateSendMessageInternalUpdate = await luxon_1.DateTime.local().plus({ seconds: time });
                        const phrase = await (0, ListInternalPhrases_1.default)();
                        await (0, util_1.stateTyping)(message);
                        client.sendMessage(message.from, phrase);
                        return;
                    }
                    return;
                }
            });
        }
        catch (error) {
            console.log("ERRO>>>>", error);
        }
    }
}
exports.default = Monitoring;
//# sourceMappingURL=ChatMonitoringInternal.js.map