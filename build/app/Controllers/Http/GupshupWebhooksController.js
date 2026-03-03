"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GupshupMonitoring_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const luxon_1 = require("luxon");
const axios_1 = __importDefault(require("axios"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = require("fs");
const path_1 = require("path");
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
class GupshupWebhookController {
    constructor() {
        this.monitoring = new GupshupMonitoring_1.default();
    }
    async handle({ request, response }) {
        const rawBody = request.raw();
        const appName = request.input('app');
        console.log('=== GUPSHUP WEBHOOK RAW STRING ===');
        console.log(rawBody);
        console.log('=== FIM RAW STRING ===');
        const body = request.all();
        response.status(200).send({ ok: true });
        try {
            if (body?.type === 'message' && body?.payload?.type === 'audio') {
                const audioPayload = body.payload?.payload;
                const url = audioPayload?.url;
                const contentType = audioPayload?.contentType || '';
                const dialCode = String(body.payload?.sender?.dial_code || '').trim();
                if (!url) {
                    console.log('⚠️ Áudio recebido mas sem URL no payload.');
                    return;
                }
                const extension = contentType.includes('ogg') ? 'ogg' : contentType.includes('mpeg') ? 'mp3' : 'bin';
                const messageId = String(body.payload?.id || Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_');
                const fileName = `${messageId}.${extension}`;
                const filePath = Application_1.default.makePath(`Medias/Customchats/${fileName}`);
                await fs_1.promises.mkdir((0, path_1.dirname)(filePath), { recursive: true });
                const res = await axios_1.default.get(url, {
                    responseType: 'arraybuffer',
                    validateStatus: () => true,
                    timeout: 30000,
                });
                const ct = String(res.headers?.['content-type'] || '');
                if (res.status !== 200) {
                    console.log('❌ Download do áudio falhou (status != 200)', { status: res.status, ct });
                    return;
                }
                if (!ct.startsWith('audio/')) {
                    console.log('❌ Download retornou conteúdo que NÃO é áudio', { status: res.status, ct });
                    return;
                }
                const buf = Buffer.from(res.data);
                if (extension === 'ogg') {
                    const magic = buf.slice(0, 4).toString('ascii');
                    if (magic !== 'OggS') {
                        console.log('❌ Conteúdo baixado não parece OGG (header inválido)', { magic, ct });
                        return;
                    }
                }
                await fs_1.promises.writeFile(filePath, buf);
                console.log('🎧 Áudio Gupshup salvo em:', filePath, 'CT:', ct);
                const relativeFileName = fileName;
                console.log('🟢 Criando novo Customchat só com áudio:', { appName, dialCode, relativeFileName });
                await Customchat_1.default.create({
                    chatname: String(appName || '').trim(),
                    cellphoneserialized: dialCode,
                    path_media: relativeFileName,
                });
                console.log('✅ Novo Customchat criado com path_media.');
                return;
            }
            const evt = parseMessageEvent(body);
            if (evt) {
                const ack = mapEventToAck(evt.eventType);
                await Chat_1.default.query().where('gupshup_gs_id', evt.gsId).update({ ack });
                return;
            }
            const msg = parseInbound(body);
            if (!msg)
                return;
            await this.monitoring.handleInbound(msg);
        }
        catch (error) {
            console.error('Erro no processamento do webhook Gupshup:', error);
            try {
                await Log_1.default.create({
                    type: 'gupshup_webhook_error',
                    description: 'Erro ao processar webhook Gupshup',
                    log: JSON.stringify({
                        error: String(error),
                        stack: error?.stack,
                    }),
                    createdAt: luxon_1.DateTime.now(),
                });
            }
            catch (e) {
                console.error('Erro ao salvar Log de webhook Gupshup:', e);
            }
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