"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAgent = void 0;
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const SendMessage_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendMessage"));
const SendRepeatedMessage_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/SendRepeatedMessage");
const luxon_1 = require("luxon");
const ChatMonitoring_1 = __importDefault(require("./ChatMonitoring/ChatMonitoring"));
const ChatMonitoringInternal_1 = __importDefault(require("./ChatMonitoring/ChatMonitoringInternal"));
const SendMessageInternal_1 = __importDefault(require("./SendMessageInternal"));
const util_1 = require("./util");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const WhatsAppClientManager_1 = __importDefault(require("./WhatsAppClientManager"));
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
async function getStatusSendMessage() {
    const result = await Config_1.default.query().select('valuebool', 'valuedatetime').where('id', 'statusSendMessage').first();
    const dateNow = luxon_1.DateTime.now();
    const dateConfig = luxon_1.DateTime.fromJSDate(result?.$attributes.valuedatetime);
    const diffMinutes = dateNow.diff(dateConfig).as('minutes');
    if (result?.$attributes.valuebool == 1 && diffMinutes > 5)
        return true;
    else
        return false;
}
async function startAgent(_agent) {
    console.log("whatsappConnections.....");
    const agent = await Agent_1.default.findOrFail(_agent.id);
    if (!_agent) {
        console.log("CHATNAME INVÁLIDO - Verifique o .env Chatname está igual ao name tabela Agents");
        return;
    }
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: _agent.id, dataPath: Application_1.default.tmpPath('/sessions') }),
        puppeteer: {
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox',
                '--max-memory=512MB',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            dumpio: false,
            timeout: 60000,
            headless: true,
        }
    });
    client.initialize();
    client.on('loading_screen', (percent, message) => {
        console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
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
    await client.on('authenticated', async () => {
        console.log(`AUTHENTICATED ${agent.name}`);
        agent.status = 'Authentication';
        agent.statusconnected = true;
        agent.number_phone = client.info?.wid?.user || null;
        agent.qrcode = null;
        agent.save();
    });
    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
    });
    client.on('ready', async () => {
        console.log(`READY...${agent.name}`);
        const state = await client.getState();
        console.log("State:", state);
        const infoClient = await client.info;
        console.log("Client:", infoClient.pushname, "- Phone number:", infoClient.wid.user);
        agent.status = state;
        agent.statusconnected = true;
        agent.number_phone = client.info.wid.user;
        agent.qrcode = null;
        await agent.save();
    });
    const startTimeSendMessage = agent.interval_init_message;
    const endTimeSendMessage = agent.interval_final_message;
    setInterval(async () => {
        const statusSendMessage = await getStatusSendMessage();
        if (statusSendMessage) {
            (0, SendMessage_1.default)(client, agent);
        }
    }, await (0, util_1.GenerateRandomTime)(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'));
    setInterval(async () => {
        const statusSendMessage = await getStatusSendMessage();
        if (statusSendMessage) {
            if (process.env.SELF_CONVERSATION?.toLocaleLowerCase() === "true") {
                await (0, SendMessageInternal_1.default)(client);
            }
        }
    }, await (0, util_1.GenerateRandomTime)(600, 900, '----Time Send Message'));
    if (process.env.SERVER === 'true') {
        await (0, SendRepeatedMessage_1.sendRepeatedMessage)(agent);
    }
    const chatMonitoring = new ChatMonitoring_1.default;
    await chatMonitoring.monitoring(client, agent);
    if (process.env.SELF_CONVERSATION?.toLowerCase() === "true") {
        const chatMonitoringInternal = new ChatMonitoringInternal_1.default;
        await chatMonitoringInternal.monitoring(client);
    }
    client.on('message_ack', async (msg, ack) => {
        if (ack >= 2) {
            await Chat_1.default.query()
                .where('message', msg.body)
                .andWhere('cellphoneserialized', msg.to)
                .andWhere('chatnumber', 'like', String(msg.from).replace(/\D/g, ''))
                .update({ ack: msg.ack });
        }
    });
    client.on('disconnected', async (reason) => {
        try {
            agent.status = 'Disconnected';
            agent.statusconnected = false;
            await agent.save();
        }
        catch (error) {
        }
        await Shippingcampaign_1.default.create({
            interaction_id: 3,
            interaction_seq: 1,
            message: `O agente ${agent.number_phone} foi desconectado!`,
            cellphone: '31985228619',
            reg: 1,
            name: 'Bruno',
            prioritysend: true
        });
        console.log("EXECUTANDO DISCONECT");
        console.log("REASON>>>", reason);
        return;
    });
    console.log("FINAL DO ZAP CONECTIONS &&&&&&&");
    WhatsAppClientManager_1.default.addClient(agent.id.toString(), client);
    let rejectCalls = true;
    client.on('call', async (call) => {
        console.log('Call received, rejecting. GOTO Line 261 to disable', call);
        if (rejectCalls)
            await call.reject();
        await client.sendMessage(call.from, `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
    });
    return client;
}
exports.startAgent = startAgent;
//# sourceMappingURL=whatsappConnection.js.map