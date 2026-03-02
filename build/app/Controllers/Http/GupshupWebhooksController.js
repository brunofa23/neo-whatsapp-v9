"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GupshupMonitoring_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup-monitoring/GupshupMonitoring"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const luxon_1 = require("luxon");
const axios_1 = __importDefault(require("axios"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
class GupshupWebhookController {
    constructor() {
        this.monitoring = new GupshupMonitoring_1.default();
    }
    async findOrCreateChatByNumber(cellphoneserialized, senderName, appName) {
        let chat = await Chat_1.default.query()
            .where('cellphoneserialized', cellphoneserialized)
            .orderBy('id', 'desc')
            .first();
        if (!chat) {
            chat = await Chat_1.default.create({
                cellphoneserialized,
                cellphone: cellphoneserialized,
                chatname: senderName || appName || 'WhatsApp',
            });
        }
        return chat;
    }
    async createInboundCustomchat(options) {
        const { chat, cellphoneserialized, senderName, appName, message, response, pathMedia } = options;
        const rawText = (response ?? message) || '';
        const finalResponse = rawText.trim() !== ''
            ? rawText
            : pathMedia
                ? '[Áudio / mídia recebida]'
                : '';
        const custom = await Customchat_1.default.create({
            chats_id: chat.id,
            reg: chat.reg,
            cellphone: chat.cellphone || cellphoneserialized,
            cellphoneserialized,
            chatname: senderName || chat.chatname || appName || 'WhatsApp',
            chatnumber: chat.chatnumber || null,
            message: '',
            response: finalResponse,
            path_media: pathMedia || null,
            returned: true,
            messagesent: false,
        });
        await Talk_1.default.create({
            chat_id: chat.id,
            reg: custom.reg,
            cellphone: cellphoneserialized,
            message: finalResponse,
            chatnumber: custom.chatnumber,
            type: 'from',
        });
        return custom;
    }
    async updateAckFromMessageEvent(appName, payload) {
        const eventType = payload.type;
        const innerPayload = payload.payload || {};
        const whatsappMessageIdFromEvent = innerPayload.whatsappMessageId;
        const messageIdFromEvent = payload.id;
        const gsIdFromEvent = payload.gsId || innerPayload.gsId;
        const candidateIds = [
            whatsappMessageIdFromEvent,
            messageIdFromEvent,
            gsIdFromEvent,
        ].filter(Boolean);
        if (candidateIds.length === 0) {
            console.warn('message-event sem nenhum ID utilizável, ignorando.', {
                appName,
                payload,
            });
            return;
        }
        console.log('📡 message-event recebido Gupshup (ACK):', {
            appName,
            eventType,
            candidateIds,
        });
        const custom = await Customchat_1.default.query()
            .where((query) => {
            candidateIds.forEach((id, idx) => {
                if (idx === 0) {
                    query.where('gupshup_gs_id', id);
                }
                else {
                    query.orWhere('gupshup_gs_id', id);
                }
            });
        })
            .orderBy('id', 'desc')
            .first();
        if (!custom) {
            console.warn('Nenhum Customchat encontrado para gupshup_gs_id em:', candidateIds);
            return;
        }
        let ack = custom.ack ?? 0;
        switch (eventType) {
            case 'submitted':
            case 'enqueued':
                ack = 1;
                break;
            case 'sent':
                ack = 2;
                break;
            case 'delivered':
                ack = 3;
                break;
            case 'read':
                ack = 4;
                break;
            case 'failed':
                ack = 9;
                break;
            default:
                console.log('message-event com tipo não mapeado:', eventType);
                break;
        }
        custom.ack = ack;
        await custom.save();
        console.log('✅ ACK atualizado via message-event:', {
            id: custom.id,
            gupshup_gs_id: custom.gupshupGsId,
            eventType,
            ack,
        });
    }
    async handle({ request, response }) {
        const rawBody = request.raw();
        const appName = request.input('app');
        if (appName === 'Digi3Sistemas6') {
            console.log('=== GUPSHUP WEBHOOK RAW STRING ===');
            console.log(rawBody);
            console.log('=== FIM RAW STRING ===');
        }
        const body = request.all();
        response.status(200).send({ ok: true });
        try {
            const type = body?.type;
            const payload = body?.payload;
            if (!payload) {
                console.log('Webhook sem payload, ignorando.');
                return;
            }
            if (type === 'message-event') {
                await this.updateAckFromMessageEvent(appName, payload);
                return;
            }
            try {
                await this.monitoring.handle(payload);
            }
            catch (err) {
                console.warn('Erro no GupshupMonitoring.handle (ignorado):', err);
            }
            if (type !== 'message') {
                console.log('Webhook não é do tipo "message", type:', type);
                return;
            }
            const messageType = payload.type;
            const source = payload.source;
            const sender = payload.sender || {};
            const dialCode = sender.dial_code;
            const senderName = sender.name;
            const cellphoneserialized = await (0, util_1.normalizePhoneKey)(dialCode || source);
            const chat = await this.findOrCreateChatByNumber(cellphoneserialized, senderName, appName || null);
            if (messageType === 'text') {
                const text = payload.payload?.text || '';
                console.log('📩 Texto recebido Gupshup:', {
                    appName,
                    cellphoneserialized,
                    text,
                });
                await this.createInboundCustomchat({
                    chat,
                    cellphoneserialized,
                    senderName,
                    appName,
                    message: text,
                    pathMedia: null,
                });
                await Chat_1.default.query().where('id', chat.id).update({ last_response: 0 });
                return;
            }
            if (messageType === 'audio') {
                const audioUrl = payload.payload?.url;
                const contentType = payload.payload?.contentType;
                if (!audioUrl) {
                    console.warn('Payload de áudio sem URL, ignorando.');
                    return;
                }
                let ext = 'audio';
                if (contentType?.includes('ogg')) {
                    ext = 'ogg';
                }
                else if (contentType?.includes('mpeg') || contentType?.includes('mp3')) {
                    ext = 'mp3';
                }
                const rawId = String(payload.id);
                const safeId = rawId.replace(/[^a-zA-Z0-9_.-]/g, '_');
                const relativeFileName = `${safeId}.${ext}`;
                const baseDir = Application_1.default.makePath('Medias', 'Customchats');
                const absolutePath = `${baseDir}/${relativeFileName}`;
                await fs_1.promises.mkdir((0, path_1.dirname)(absolutePath), { recursive: true });
                const audioResponse = await axios_1.default.get(audioUrl, {
                    responseType: 'arraybuffer',
                });
                await fs_1.promises.writeFile(absolutePath, Buffer.from(audioResponse.data));
                console.log(`🎧 Áudio Gupshup salvo em: ${absolutePath} CT: ${contentType}`);
                console.log('🟢 Criando novo Customchat só com áudio:', {
                    appName,
                    dialCode,
                    cellphoneserialized,
                    relativeFileName,
                    chats_id: chat.id,
                });
                await this.createInboundCustomchat({
                    chat,
                    cellphoneserialized,
                    senderName,
                    appName,
                    message: '[Áudio recebido]',
                    pathMedia: relativeFileName,
                });
                await Chat_1.default.query().where('id', chat.id).update({ last_response: 0 });
                return;
            }
            console.log('Tipo de mensagem não tratado explicitamente:', messageType);
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
//# sourceMappingURL=GupshupWebhooksController.js.map