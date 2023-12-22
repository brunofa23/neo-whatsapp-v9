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
    console.log("ENTREI NO SEDREPEATEDMESSAGE");
    let agent;
    async function getAgent(chatName) {
        console.log("GET AGENT...");
        agent = await Agent_1.default.findBy('name', chatName);
        if (!agent || agent == undefined) {
            console.log("Erro: Verifique o chatnumer");
            return;
        }
        return agent;
    }
    async function executePersistShippingcampaign(interval) {
        setInterval(async () => {
            const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
            agent = await getAgent(process.env.CHAT_NAME);
            if (!executingSendMessage?.valuebool) {
                if (await (0, util_1.TimeSchedule)()) {
                    console.log(`Buscando dados no Smart: ${date}`);
                    await (0, PersistShippingcampaign_1.default)();
                    console.log("INTERVAL");
                }
            }
        }, await (0, util_1.GenerateRandomTime)(agent.interval_init_query, agent.interval_final_query, '****Send Message Repeated'));
    }
    let interval = 0;
    await getAgent(process.env.CHAT_NAME);
    const executingSendMessage = await Config_1.default.find('executingSendMessage');
    await executePersistShippingcampaign(interval);
}
module.exports = { sendRepeatedMessage };
//# sourceMappingURL=SendRepeatedMessage%20copy.js.map