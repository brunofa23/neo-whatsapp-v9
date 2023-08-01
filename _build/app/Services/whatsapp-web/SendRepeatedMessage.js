"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const PersistShippingcampaign_1 = __importDefault(require("./PersistShippingcampaign"));
const PersistValidationPhones_1 = __importDefault(require("./PersistValidationPhones"));
const SendMessage_1 = __importDefault(require("./SendMessage"));
const util_1 = require("./util");
async function sendRepeatedMessage(client) {
    const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
    console.log(`Processo Inicializado ${date}`);
    if (!global.executingSendMessage) {
        await (0, PersistShippingcampaign_1.default)();
        const shippingCampaignList = await (0, PersistValidationPhones_1.default)(client);
        await (0, SendMessage_1.default)(client, shippingCampaignList);
    }
}
module.exports = { sendRepeatedMessage };
//# sourceMappingURL=SendRepeatedMessage.js.map