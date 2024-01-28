"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DatasourcesController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/DatasourcesController"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const PersistShippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/PersistShippingcampaign"));
const luxon_1 = require("luxon");
const util_1 = require("../app/Services/whatsapp-web/util");
const whatsapp_1 = require("../app/Services/whatsapp-web/whatsapp");
const whatsappConnection_1 = require("../app/Services/whatsapp-web/whatsappConnection");
async function connectionAll() {
    try {
        console.log("connection all acionado...");
        const agents = await Agent_1.default.query()
            .where('active', true);
        for (const agent of agents) {
            if (agent) {
                if (agent.default_chat) {
                    console.log("Conectando Agente Default");
                    await (0, whatsapp_1.startAgentChat)(agent);
                }
                else {
                    console.log("Conectando Agente Comum");
                    await (0, whatsappConnection_1.startAgent)(agent);
                }
            }
        }
    }
    catch (error) {
        error;
    }
}
async function sendRepeatedMessage() {
    const executingSendMessage = await Config_1.default.find('executingSendMessage');
    setInterval(async () => {
        const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        if (!executingSendMessage?.valuebool) {
            if (await (0, util_1.TimeSchedule)()) {
                console.log(`Buscando dados no Smart(Server): ${date}`);
                await (0, PersistShippingcampaign_1.default)();
                const datasourcesController = new DatasourcesController_1.default;
                await datasourcesController.confirmScheduleAll();
                await datasourcesController.cancelScheduleAll();
            }
        }
    }, await (0, util_1.GenerateRandomTime)(300, 400, '****Send Message Repeated'));
}
async function resetStatusConnected() {
    await Agent_1.default.query().update({ status: null, statusconnected: false });
}
module.exports = { connectionAll, sendRepeatedMessage, resetStatusConnected };
//# sourceMappingURL=events.js.map