"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const whatsappConnection_1 = require("../app/Services/whatsapp-web/whatsappConnection");
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const luxon_1 = require("luxon");
const PersistShippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/PersistShippingcampaign"));
const util_1 = require("../app/Services/whatsapp-web/util");
async function connectionAll() {
    try {
        console.log("connection all acionado...");
        const agents = await Agent_1.default.query();
        for (const agent of agents) {
            console.log("Conectando agente:", agent.id);
            await (0, whatsappConnection_1.startAgent)(agent);
        }
    }
    catch (error) {
        error;
    }
}
async function sendRepeatedMessage() {
    console.log("EXECUTANDO BUSCA SMART");
    const executingSendMessage = await Config_1.default.find('executingSendMessage');
    setInterval(async () => {
        const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        if (!executingSendMessage?.valuebool) {
            if (await (0, util_1.TimeSchedule)()) {
                console.log(`Buscando dados no Smart(Server): ${date}`);
                await (0, PersistShippingcampaign_1.default)();
            }
        }
    }, await (0, util_1.GenerateRandomTime)(200, 300, '****Send Message Repeated'));
}
async function resetStatusConnected() {
    await Agent_1.default.query().update({ statusconnected: false });
}
module.exports = { connectionAll, sendRepeatedMessage, resetStatusConnected };
//# sourceMappingURL=events.js.map