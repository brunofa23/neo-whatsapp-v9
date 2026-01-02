"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDispatchLoop = exports.stopDispatchLoop = void 0;
const timers = new Map();
const locks = new Set();
function stopDispatchLoop(agentId) {
    const t = timers.get(agentId);
    if (t)
        clearTimeout(t);
    timers.delete(agentId);
    locks.delete(agentId);
}
exports.stopDispatchLoop = stopDispatchLoop;
function startDispatchLoop(agent, sender, getStatusSendMessage, GenerateRandomTime) {
    stopDispatchLoop(agent.id);
    const tick = async () => {
        try {
            if (locks.has(agent.id))
                return;
            locks.add(agent.id);
            const ok = await getStatusSendMessage();
            if (ok) {
                await sender();
            }
        }
        catch (e) {
            console.error(`[${agent.id}] DispatchLoop error:`, e);
        }
        finally {
            locks.delete(agent.id);
            const delay = await GenerateRandomTime(agent.interval_init_message, agent.interval_final_message, 'DispatchLoop');
            const id = setTimeout(tick, delay);
            timers.set(agent.id, id);
        }
    };
    tick();
}
exports.startDispatchLoop = startDispatchLoop;
//# sourceMappingURL=DispatchLoops.js.map