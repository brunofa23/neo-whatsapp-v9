"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const SendMessage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendMessage"));
const SendRepeatedMessage_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendRepeatedMessage");
const ChatMonitoring_1 = __importDefault(require("./ChatMonitoring/ChatMonitoring"));
const ChatMonitoringInternal_1 = __importDefault(require("./ChatMonitoring/ChatMonitoringInternal"));
const SendMessageInternal_1 = __importDefault(require("./SendMessageInternal"));
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
async function startAgent(_agent) {
    const agent = await Agent_1.default.findOrFail(_agent.id);
    if (!_agent) {
        console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents");
        return;
    }
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: _agent.id }),
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
        console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
        agent.status = `Carregando: ${_agent.name} - ${percent} - ${message}`;
        agent.save();
    });
    client.on('qr', async (qr) => {
        agent.status = "Qrcode require";
        agent.statusconnected = false;
        await agent.save();
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Ocorreu um erro ao gerar o URL de dados:', err);
                return;
            }
            agent.qrcode = url;
            agent.save();
        });
        qrcodeTerminal.generate(qr, { small: true });
    });
    client.on('authenticated', async () => {
        console.log(`AUTHENTICATED ${agent.name}`);
        agent.status = 'Authentication';
        agent.save();
    });
    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
    });
    client.on('ready', async () => {
        console.log(`READY...${agent.name}`);
        const state = await client.getState();
        console.log("State:", state);
        console.log("INFO:", await client.info);
        await (0, SendMessage_1.default)(client, agent);
        if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
            console.log("self_conversation", process.env.SELF_CONVERSATION);
            await (0, SendMessageInternal_1.default)(client);
        }
        agent.status = state;
        agent.statusconnected = true;
        agent.number_phone = client.info.wid.user;
        agent.qrcode = null;
        await agent.save();
    });
    if (process.env.SERVER === 'true') {
        await (0, SendRepeatedMessage_1.sendRepeatedMessage)(agent);
    }
    const chatMonitoring = new ChatMonitoring_1.default;
    await chatMonitoring.monitoring(client, agent);
    if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
        const chatMonitoringInternal = new ChatMonitoringInternal_1.default;
        await chatMonitoringInternal.monitoring(client);
    }
    client.on('disconnected', async (reason) => {
        agent.status = 'Disconnected';
        agent.statusconnected = false;
        await agent.save();
        console.log("EXECUTANDO DISCONECT");
        console.log("REASON>>>", reason);
    });
    let rejectCalls = true;
    client.on('call', async (call) => {
        console.log('Call received, rejecting. GOTO Line 261 to disable', call);
        if (rejectCalls)
            await call.reject();
        await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
    });
    return client;
}
module.exports = { startAgent };
//# sourceMappingURL=whatsappConnection.js.map