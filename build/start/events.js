"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const whatsappConnection_1 = require("../app/Services/whatsapp-web/whatsappConnection");
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
module.exports = { connectionAll };
//# sourceMappingURL=events.js.map