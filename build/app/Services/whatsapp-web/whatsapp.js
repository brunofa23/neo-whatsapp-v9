"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatMonitoring_1 = __importDefault(require("./ChatMonitoring/ChatMonitoring"));
const util_1 = require("./util");
const SendMessage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendMessage"));
const SendRepeatedMessage_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendRepeatedMessage");
const luxon_1 = require("luxon");
async function executeWhatsapp() {
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
        const hourSend = await (0, util_1.DateFormat)("HH", luxon_1.DateTime.local());
        const startTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE);
        const endtTimeSendMessageRepeated = parseInt(process.env.EXECUTE_SEND_REPEATED_MESSAGE_END);
        const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE);
        const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END);
        if (parseInt(hourSend) > 7 && parseInt(hourSend) < 20) {
            setInterval(async () => {
                await (0, SendRepeatedMessage_1.sendRepeatedMessage)(client);
            }, await (0, util_1.GenerateRandomTime)(startTimeSendMessageRepeated, endtTimeSendMessageRepeated, '****Send Message Repeated'));
            setInterval(async () => {
                if (!global.executingSendMessage) {
                    await (0, SendMessage_1.default)(client);
                }
            }, await (0, util_1.GenerateRandomTime)(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'));
        }
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
//# sourceMappingURL=whatsapp.js.map