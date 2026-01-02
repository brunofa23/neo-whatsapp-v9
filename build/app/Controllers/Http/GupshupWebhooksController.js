"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GupshupMonitoring_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring"));
class GupshupWebhookController {
    constructor() {
        this.monitoring = new GupshupMonitoring_1.default();
    }
    async handle({ request, response }) {
        const payload = request.all();
        console.log("passei no handle");
        console.log('=== GUPSHUP WEBHOOK RECEBIDO ===');
        console.log(JSON.stringify(payload, null, 2));
        console.log('=== FIM ===');
        response.status(200).send({ ok: true });
        const msg = parseInbound(payload);
        if (!msg)
            return;
        await this.monitoring.handleInbound(msg);
    }
}
exports.default = GupshupWebhookController;
function parseInbound(payload) {
    if (payload?.type !== 'message')
        return null;
    const from = payload?.payload?.source ||
        payload?.payload?.sender?.phone;
    const to = payload?.payload?.destination ||
        payload?.payload?.app;
    const text = payload?.payload?.payload?.text || '';
    const type = payload?.payload?.type || 'text';
    const hasMedia = type !== 'text';
    if (!from)
        return null;
    return {
        from: String(from),
        to: String(to || ''),
        body: String(text),
        hasMedia,
        raw: payload
    };
}
//# sourceMappingURL=GupshupWebhooksController.js.map