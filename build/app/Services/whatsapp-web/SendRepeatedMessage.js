"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const PersistShippingcampaign_1 = __importDefault(require("./PersistShippingcampaign"));
const util_1 = require("./util");
async function sendRepeatedMessage(client) {
    const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
    console.log(`Processo Inicializado ${date}`);
    if (!global.executingSendMessage) {
        await (0, PersistShippingcampaign_1.default)();
    }
}
module.exports = { sendRepeatedMessage };
//# sourceMappingURL=SendRepeatedMessage.js.map