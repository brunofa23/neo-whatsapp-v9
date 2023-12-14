"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const luxon_1 = require("luxon");
const PersistShippingcampaign_1 = __importDefault(require("./PersistShippingcampaign"));
const util_1 = require("./util");
async function sendRepeatedMessage() {
    let startTimeSendMessageRepeated;
    let endtTimeSendMessageRepeated;
    const executingSendMessage = await Config_1.default.find('executingSendMessage');
    async function getAgent(chatName) {
        const agent = await Agent_1.default.findBy('name', chatName);
        if (!agent || agent == undefined) {
            console.log("Erro: Verifique o chatnumer");
            return;
        }
        startTimeSendMessageRepeated = agent.interval_init_query;
        endtTimeSendMessageRepeated = agent.interval_final_query;
    }
    await getAgent(process.env.CHAT_NAME);
    setInterval(async () => {
        const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        if (!executingSendMessage?.valuebool) {
            if (await (0, util_1.TimeSchedule)()) {
                console.log(`Buscando dados no Smart: ${date}`);
                await (0, PersistShippingcampaign_1.default)();
            }
        }
    }, await (0, util_1.GenerateRandomTime)(startTimeSendMessageRepeated, endtTimeSendMessageRepeated, '****Send Message Repeated'));
}
module.exports = { sendRepeatedMessage };
//# sourceMappingURL=SendRepeatedMessage.js.map