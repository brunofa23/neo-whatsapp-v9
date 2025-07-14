"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ListInternalPhrases_1 = __importDefault(require("./ListInternalPhrases"));
const util_1 = require("./util");
async function PhoneInternal() {
    const list_phone_talking = process.env.LIST_PHONES_TALK;
    const list_phones = list_phone_talking?.split(",");
    if (list_phones?.length >= 0) {
        const phone = list_phones[Math.floor(Math.random() * list_phones?.length)];
        return phone;
    }
}
exports.default = async (client) => {
    async function sendMessages() {
        if (await (0, util_1.TimeSchedule)() == false) {
            return;
        }
        const phrase = await (0, ListInternalPhrases_1.default)();
        try {
            if (!client || !client.info || !client.info.wid) {
                console.log("Cliente do WhatsApp desconectado ou inválido.");
                return;
            }
            const pupBrowser = client?.pupBrowser;
            if (pupBrowser && typeof pupBrowser.isConnected === 'function' && !pupBrowser.isConnected()) {
                console.log("Navegador do WhatsApp fechado.");
                return;
            }
            await client.sendMessage('120363170786645695@g.us', phrase);
        }
        catch (error) {
            console.log("Erro ao enviar mensagem:", error.message);
        }
    }
    await sendMessages();
};
//# sourceMappingURL=SendMessageInternal.js.map