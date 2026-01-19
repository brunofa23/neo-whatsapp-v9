"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GupshupMonitoring_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const luxon_1 = require("luxon");
class GupshupWebhookController {
    constructor() {
        this.monitoring = new GupshupMonitoring_1.default();
    }
    async handle({ request, response }) {
        console.log("PASSO 1.1 55555");
        const payload = request.all();
        response.status(200).send({ ok: true });
        try {
            const evt = parseMessageEvent(payload);
            if (evt) {
                const ack = mapEventToAck(evt.eventType);
                const updated = await Chat_1.default.query()
                    .where('gupshup_gs_id', evt.gsId)
                    .update({
                    ack,
                });
                if (!updated) {
                    await Log_1.default.create({
                        name: 'gupshup_message_event_unmatched',
                        message: JSON.stringify({
                            at: luxon_1.DateTime.now().toISO(),
                            gsId: evt.gsId,
                            eventType: evt.eventType,
                            ack,
                            destination: evt.destination,
                            ts: evt.ts,
                        }),
                        description: 'Evento de mensagem sem chat correspondente (gupshup_gs_id não encontrado)',
                    });
                }
                return;
            }
            const msg = parseInbound(payload);
            if (!msg)
                return;
            await this.monitoring.handleInbound(msg);
        }
        catch (error) {
            await Log_1.default.create({
                name: 'GupshupWebhookError',
                message: error?.message || String(error),
                description: error?.stack || 'Sem stack',
            });
        }
    }
}
exports.default = GupshupWebhookController;
function mapEventToAck(eventTypeRaw) {
    const t = String(eventTypeRaw || '').trim().toLowerCase();
    if (!t)
        return 0;
    if (t === 'read')
        return 3;
    if (t === 'played')
        return 4;
    if (t === 'delivered')
        return 1;
    if (t === 'sent')
        return 2;
    if (t === 'submitted' || t === 'queued' || t === 'pending')
        return 0;
    if (t === 'failed' || t === 'error' || t === 'undelivered')
        return 0;
    return 0;
}
function parseMessageEvent(payload) {
    if (payload?.type !== 'message-event')
        return null;
    const p = payload?.payload || {};
    const gsId = String(p?.gsId || '').trim();
    const eventType = String(p?.type || '').trim();
    const destination = String(p?.destination || '').trim();
    const ts = Number(p?.payload?.ts || 0);
    if (!gsId || !eventType)
        return null;
    return { gsId, eventType, destination, ts, raw: payload };
}
function parseInbound(payload) {
    if (payload?.type !== 'message')
        return null;
    const p = payload?.payload || {};
    const from = p?.sender?.phone || p?.source;
    if (!from)
        return null;
    const text = p?.payload?.postbackText ||
        p?.payload?.text ||
        p?.payload?.payload?.text ||
        p?.text ||
        '';
    const inboundType = String(p?.type || 'text');
    const hasMedia = inboundType !== 'text' && inboundType !== 'quick_reply';
    const gsId = p?.context?.gsId || null;
    const to = p?.destination || p?.to || '';
    return {
        from: String(from),
        to: String(to),
        body: String(text),
        hasMedia,
        context: gsId ? { gsId: String(gsId) } : undefined,
        raw: payload,
    };
}
//# sourceMappingURL=GupshupWebhooksController.js.map