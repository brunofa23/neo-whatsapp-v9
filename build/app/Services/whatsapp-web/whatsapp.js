"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SendRepeatedMessage_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendRepeatedMessage");
const ClientMethods_1 = __importDefault(require("../../Services/whatsapp-web/ChatMonitoring/ClientMethods"));
const ChatMonitoring_1 = __importDefault(require("./ChatMonitoring/ChatMonitoring"));
async function executeWhatsapp(logout = false) {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcode = require('qrcode-terminal');
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
        qrcode.generate(qr, { small: true });
        console.log(qr);
    });
    client.on('authenticated', () => {
        console.log('AUTHENTICATED');
    });
    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
    });
    client.on('ready', async () => {
        console.log('Lendo na Inicialização!');
        const EXECUTE_SEND_REPEATED_MESSAGE = process.env.EXECUTE_SEND_REPEATED_MESSAGE;
        setInterval(async () => {
            const verify = await (0, SendRepeatedMessage_1.sendRepeatedMessage)(client);
        }, EXECUTE_SEND_REPEATED_MESSAGE);
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
    if (logout) {
        const execMethod = new ClientMethods_1.default;
        await execMethod.executeMethod(client, "logout");
    }
}
module.exports = { executeWhatsapp };
//# sourceMappingURL=whatsapp.js.map