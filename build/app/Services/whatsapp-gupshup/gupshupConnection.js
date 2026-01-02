"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGupshupLoop = exports.stopGupshupLoop = void 0;
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const luxon_1 = require("luxon");
const SendDispatcher_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/SendDispatcher"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
async function getStatusSendMessage() {
    const result = await Config_1.default.query()
        .select('valuebool', 'valuedatetime')
        .where('id', 'statusSendMessage')
        .first();
    const valuebool = result?.$attributes?.valuebool;
    const valuedatetime = result?.$attributes?.valuedatetime;
    if (!valuedatetime)
        return false;
    const dateNow = luxon_1.DateTime.now();
    const dateConfig = luxon_1.DateTime.fromJSDate(valuedatetime);
    const diffMinutes = dateNow.diff(dateConfig).as('minutes');
    return valuebool == 1 && diffMinutes > 5;
}
const gupshupTimers = new Map();
const gupshupLocks = new Set();
function stopGupshupLoop(agentId) {
    const t = gupshupTimers.get(agentId);
    if (t)
        clearTimeout(t);
    gupshupTimers.delete(agentId);
    gupshupLocks.delete(agentId);
}
exports.stopGupshupLoop = stopGupshupLoop;
function startGupshupLoop(agent) {
    const agentId = agent.id;
    stopGupshupLoop(agentId);
    const tick = async () => {
        try {
            if (gupshupLocks.has(agentId))
                return;
            gupshupLocks.add(agentId);
            const statusSendMessage = await getStatusSendMessage();
            if (statusSendMessage) {
                await (0, SendDispatcher_1.default)({ agent, client: null });
            }
        }
        catch (e) {
            console.error(`[${agentId}] Erro no loop Gupshup:`, e);
        }
        finally {
            gupshupLocks.delete(agentId);
            const fresh = await Agent_1.default.query()
                .select('interval_init_message', 'interval_final_message')
                .where('id', agentId)
                .first();
            const startSafe = Number(fresh?.interval_init_message || 60000);
            const endSafe = Number(fresh?.interval_final_message || 80000);
            const delay = await (0, util_1.GenerateRandomTime)(startSafe, endSafe, '----Time Send Message Gupshup');
            const id = setTimeout(tick, delay);
            gupshupTimers.set(agentId, id);
        }
    };
    tick();
}
exports.startGupshupLoop = startGupshupLoop;
//# sourceMappingURL=gupshupConnection.js.map