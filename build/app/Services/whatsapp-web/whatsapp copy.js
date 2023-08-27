"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SendMessage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendMessage"));
const SendRepeatedMessage_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendRepeatedMessage");
const ChatMonitoring_1 = __importDefault(require("./ChatMonitoring/ChatMonitoring"));
const util_1 = require("./util");
async function executeWhatsapp() {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcodeTerminal = require('qrcode-terminal');
    const qrcode = require('qrcode');
    const path = require('path');
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox', '--max-memory=512MB'],
            headless: true,
            setRequestInterception: true,
            setBypassCSP: true,
            setJavaScriptEnabled: false
        }
    });
    let rejectCalls = true;
    client.on('call', async (call) => {
        console.log('Call received, rejecting. GOTO Line 261 to disable', call);
        if (rejectCalls)
            await call.reject();
        await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Este número de telefone está programado para não receber chamadas. `);
    });
    client.on('qr', (qr) => {
        qrcodeTerminal.generate(qr, { small: true });
        const folderPath = path.resolve(__dirname, "../../../");
        const qrcodePath = path.join(folderPath, "/qrcode", 'qrcode.png');
        (0, util_1.ClearFolder)(qrcodePath);
        qrcode.toFile(qrcodePath, qr, { small: true }, (err) => {
            if (err) {
                console.error('Ocorreu um erro ao gerar o arquivo do código QR:', err);
                return;
            }
            console.log('Arquivo do código QR foi gerado com sucesso:');
        });
        setTimeout(() => {
            console.clear();
        }, 50000);
    });
    client.on('authenticated', () => {
        console.log('AUTHENTICATED');
    });
    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
    });
    await (0, SendRepeatedMessage_1.sendRepeatedMessage)();
    client.on('ready', async () => {
        console.log('Lendo na Inicialização!');
        await (0, SendMessage_1.default)(client);
    });
    client.on('disconnected', (reason) => {
        console.log("EXECUTANDO DISCONECT");
        console.log("REASON>>>", reason);
        client.destroy();
        client.initialize();
    });
    client.initialize();
    console.log("Inicializado");
    const chatMonitoring = new ChatMonitoring_1.default;
    await chatMonitoring.monitoring(client);
}
module.exports = { executeWhatsapp };
//# sourceMappingURL=whatsapp%20copy.js.map