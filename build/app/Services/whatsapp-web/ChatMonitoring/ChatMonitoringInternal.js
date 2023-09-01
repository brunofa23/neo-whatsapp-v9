"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../util");
const ListInternalPhrases_1 = __importDefault(require("../ListInternalPhrases"));
const luxon_1 = require("luxon");
async function verifyNumberInternal(phoneVerify) {
    const list_phone_talking = process.env.LIST_PHONES_TALK;
    const list_phones = list_phone_talking?.split(",");
    for (const phone of list_phones) {
        console.log("passei no verify internals");
        if (phoneVerify === phone)
            return true;
    }
}
let dateSendMessageInternalUpdate = luxon_1.DateTime.local();
function timeRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
class Monitoring {
    async monitoring(client) {
        try {
            client.on('message', async (message) => {
                if (await verifyNumberInternal(message.from)) {
                    console.log("INTERNAL");
                    console.log("DATA ATUAL:::::>>>>", await luxon_1.DateTime.now().toString());
                    console.log("DATA ATUALIZADA:::::>>>>", await dateSendMessageInternalUpdate.toString());
                    if (dateSendMessageInternalUpdate <= luxon_1.DateTime.now()) {
                        const time = await timeRandom(25, 190);
                        console.log("TIME", time);
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