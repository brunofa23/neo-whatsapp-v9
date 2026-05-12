"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const SendMessage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendMessage"));
const SendMessageGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendMessageGupshup"));
const SendFromQueueGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendFromQueueGupshup"));
const sentGupshupTestOnce = global.sentGupshupTestOnce ??
    (global.sentGupshupTestOnce = new Set());
async function SendDispatcher({ agent, client }) {
    const provider = (agent.provider_type || 'wwebjs').toLowerCase();
    if (provider === 'wwebjs') {
        if (client)
            await (0, SendMessage_1.default)(client, agent);
        return;
    }
    if (provider === 'gupshup') {
        const testEnabled = String(Env_1.default.get('GUPSHUP_TEST', 'false')).toLowerCase() === 'true';
        if (testEnabled) {
            if (sentGupshupTestOnce.has(agent.id))
                return;
            sentGupshupTestOnce.add(agent.id);
            const destination = String(Env_1.default.get('GUPSHUP_TEST_DESTINATION', '')).replace(/\D/g, '');
            if (!destination) {
                console.log('[GUPSHUP_TEST] destination vazio. Defina GUPSHUP_TEST_DESTINATION no .env');
                return;
            }
            const templateId = String(Env_1.default.get('GUPSHUP_TEMPLATE', '')).trim();
            if (!templateId) {
                console.log('[GUPSHUP_TEST] template vazio. Defina GUPSHUP_TEMPLATE no .env');
                return;
            }
            await (0, SendMessageGupshup_1.default)({
                agent,
                destination,
                templateId,
                params: ['Bruno Favato', '26/12/2025 14:30', 'Unidade Centro', 'Dr. João Silva'],
            });
            return;
        }
        await (0, SendFromQueueGupshup_1.default)(agent);
        return;
    }
    console.log(`[SendDispatcher] provider_type inválido: ${agent.provider_type} (AgentId=${agent.id})`);
}
exports.default = SendDispatcher;
//# sourceMappingURL=SendDispatcher.js.map