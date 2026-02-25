"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
function onlyDigits(v) {
    return String(v || '').replace(/\D/g, '');
}
async function SendMessageGupshup({ agent, destination, templateId, params, useDefaultApiKey = false, }) {
    const apiKey = Env_1.default.get(useDefaultApiKey ? 'GUPSHUP_API_KEY_DEFAULT' : 'GUPSHUP_API_KEY');
    const url = 'https://api.gupshup.io/wa/api/v1/template/msg';
    if (!apiKey)
        throw new Error(`GUPSHUP_API_KEY não configurada`);
    if (!agent.gupshup_source)
        throw new Error(`Agent ${agent.id} sem gupshup_source`);
    if (!agent.gupshup_src_name)
        throw new Error(`Agent ${agent.id} sem gupshup_src_name`);
    if (!templateId)
        throw new Error(`templateId não informado`);
    const source = onlyDigits(agent.gupshup_source);
    const dest = onlyDigits(destination);
    const data = new URLSearchParams();
    data.append('channel', 'whatsapp');
    data.append('source', source);
    data.append('destination', dest);
    data.append('src.name', agent.gupshup_src_name);
    data.append('template', JSON.stringify({
        id: templateId,
        params: (params || []).map((p) => String(p)),
    }));
    console.log('DEBUG GUPSHUP ENVIANDO >>>', {
        templateId,
        params,
        body: data.toString(),
    });
    const res = await axios_1.default.post(url, data, {
        headers: {
            apikey: apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
    });
    console.log('RESPOSTA GUPSHUP >>>', res.data);
    const { status, messageId } = res.data || {};
    if (!messageId) {
        throw new Error(`Gupshup: envio sem messageId. Resposta: ${JSON.stringify(res.data)}`);
    }
    return { status: String(status || ''), messageId: String(messageId) };
}
exports.default = SendMessageGupshup;
//# sourceMappingURL=SendMessageGupshup.js.map