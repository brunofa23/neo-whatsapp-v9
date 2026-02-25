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
async function SendTextGupshup({ source, destination, text, useDefaultApiKey = false }) {
    const apiKey = Env_1.default.get(useDefaultApiKey ? 'GUPSHUP_API_KEY_DEFAULT' : 'GUPSHUP_API_KEY');
    const url = 'https://api.gupshup.io/wa/api/v1/msg';
    const data = new URLSearchParams();
    data.append('channel', 'whatsapp');
    data.append('source', onlyDigits(source));
    data.append('destination', onlyDigits(destination));
    data.append('message', JSON.stringify({ type: 'text', text: String(text || '') }));
    const res = await axios_1.default.post(url, data, {
        headers: {
            apikey: apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
    });
    return res.data;
}
exports.default = SendTextGupshup;
//# sourceMappingURL=SendTextGupshup.js.map