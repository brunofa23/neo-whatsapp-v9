"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SendMessage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendMessage"));
const SendRepeatedMessage_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendRepeatedMessage");
const ChatMonitoring_1 = __importDefault(require("./ChatMonitoring/ChatMonitoring"));
const ChatMonitoringInternal_1 = __importDefault(require("./ChatMonitoring/ChatMonitoringInternal"));
const SendMessageInternal_1 = __importDefault(require("./SendMessageInternal"));
const util_1 = require("./util");
async function executeWhatsapp() {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcodeTerminal = require('qrcode-terminal');
    const qrcode = require('qrcode');
    const path = require('path');
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: 'Digi3' }),
        puppeteer: {
            args: ['--no-sandbox',
                '--max-memory=512MB',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            headless: true,
            setRequestInterception: true,
            setBypassCSP: true,
            setJavaScriptEnabled: false
        }
    });
    client.initialize();
    client.on('loading_screen', (percent, message) => {
        console.log('LOADING SCREEN', percent, message);
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
    });
    client.on('authenticated', () => {
        console.log('AUTHENTICATED');
    });
    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
    });
    await client.on('ready', async () => {
        console.log('READY...');
        const state = await client.getState();
        console.log("State:", state);
        await (0, SendMessage_1.default)(client);
        if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
            console.log("self_conversation", process.env.SELF_CONVERSATION);
            await (0, SendMessageInternal_1.default)(client);
        }
    });
    await (0, SendRepeatedMessage_1.sendRepeatedMessage)();
    const chatMonitoring = new ChatMonitoring_1.default;
    await chatMonitoring.monitoring(client);
    if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
        const chatMonitoringInternal = new ChatMonitoringInternal_1.default;
        await chatMonitoringInternal.monitoring(client);
    }
    client.on('disconnected', (reason) => {
        console.log("EXECUTANDO DISCONECT");
        console.log("REASON>>>", reason);
        client.destroy();
        client.initialize();
    });
    let rejectCalls = true;
    client.on('call', async (call) => {
        console.log('Call received, rejecting. GOTO Line 261 to disable', call);
        if (rejectCalls)
            await call.reject();
        await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Este número de telefone está programado para não receber chamadas. `);
    });
}
module.exports = { executeWhatsapp };
//# sourceMappingURL=whatsapp.js.map