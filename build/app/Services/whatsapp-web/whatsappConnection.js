"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAgent = void 0;
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const luxon_1 = require("luxon");
const ChatMonitoring_1 = __importDefault(require("./ChatMonitoring/ChatMonitoring"));
const ChatMonitoringInternal_1 = __importDefault(require("./ChatMonitoring/ChatMonitoringInternal"));
const SendMessageInternal_1 = __importDefault(require("./SendMessageInternal"));
const util_1 = require("./util");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const WhatsAppClientManager_1 = __importDefault(require("./WhatsAppClientManager"));
const Talk_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Talk"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const SendDispatcher_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/SendDispatcher"));
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
async function getStatusSendMessage() {
    const result = await Config_1.default.query()
        .select('valuebool', 'valuedatetime')
        .where('id', 'statusSendMessage')
        .first();
    const valuebool = result?.$attributes?.valuebool;
    const valuedatetime = result?.$attributes?.valuedatetime;
    if (!valuedatetime)
        return false;
    const dateNow = luxon_1.DateTime.now();
    const dateConfig = luxon_1.DateTime.fromJSDate(valuedatetime);
    const diffMinutes = dateNow.diff(dateConfig).as('minutes');
    return valuebool == 1 && diffMinutes > 5;
}
const sendTimers = new Map();
const sendLocks = new Set();
const internalTimers = new Map();
const internalLocks = new Set();
function stopAllLoops(agentId) {
    const t1 = sendTimers.get(agentId);
    if (t1)
        clearTimeout(t1);
    sendTimers.delete(agentId);
    sendLocks.delete(agentId);
    const t2 = internalTimers.get(agentId);
    if (t2)
        clearTimeout(t2);
    internalTimers.delete(agentId);
    internalLocks.delete(agentId);
}
function startSendLoop(client, agent) {
    const agentId = agent.id;
    const old = sendTimers.get(agentId);
    if (old)
        clearTimeout(old);
    sendTimers.delete(agentId);
    sendLocks.delete(agentId);
    const tick = async () => {
        try {
            if (sendLocks.has(agentId))
                return;
            sendLocks.add(agentId);
            const statusSendMessage = await getStatusSendMessage();
            if (statusSendMessage) {
                await (0, SendDispatcher_1.default)({ agent, client });
            }
        }
        catch (e) {
            console.error(`[${agentId}] Erro no loop SendMessage:`, e);
        }
        finally {
            sendLocks.delete(agentId);
            const fresh = await Agent_1.default.query()
                .select('interval_init_message', 'interval_final_message')
                .where('id', agentId)
                .first();
            const startSafe = Number(fresh?.interval_init_message || 60000);
            const endSafe = Number(fresh?.interval_final_message || 80000);
            const delay = await (0, util_1.GenerateRandomTime)(startSafe, endSafe, '----Time Send Message');
            const id = setTimeout(tick, delay);
            sendTimers.set(agentId, id);
        }
    };
    tick();
}
function startInternalLoop(client, agent) {
    const agentId = agent.id;
    const old = internalTimers.get(agentId);
    if (old)
        clearTimeout(old);
    internalTimers.delete(agentId);
    internalLocks.delete(agentId);
    const tick = async () => {
        try {
            if (internalLocks.has(agentId))
                return;
            internalLocks.add(agentId);
            const statusSendMessage = await getStatusSendMessage();
            if (statusSendMessage) {
                if (process.env.SELF_CONVERSATION?.toLowerCase() === 'true') {
                    await (0, SendMessageInternal_1.default)(client);
                }
            }
        }
        catch (e) {
            console.error(`[${agentId}] Erro no loop SendMessageInternal:`, e);
        }
        finally {
            internalLocks.delete(agentId);
            const delay = await (0, util_1.GenerateRandomTime)(500, 800, '----Time Send Message');
            const id = setTimeout(tick, delay);
            internalTimers.set(agentId, id);
        }
    };
    tick();
}
async function startAgent(_agent) {
    console.log('whatsappConnections.....');
    const agent = await Agent_1.default.findOrFail(_agent.id);
    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: _agent.id,
            dataPath: Application_1.default.tmpPath('/sessions'),
        }),
        puppeteer: {
            executablePath: '/snap/bin/chromium',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
            ],
            headless: true,
            dumpio: false,
            setJavaScriptEnabled: true,
        },
        webVersion: '2.3000.1026075099-alpha',
        webVersionPath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1026075099-alpha.html',
    });
    client.initialize();
    client.on('loading_screen', (percent, message) => {
        console.log(`LOADING SCREEN: ${_agent.name}`, percent, message);
    });
    client.on('qr', async (qr) => {
        try {
            agent.status = 'Qrcode require';
            agent.statusconnected = false;
            await agent.save();
            const url = await new Promise((resolve, reject) => {
                qrcode.toDataURL(qr, (err, url) => {
                    if (err)
                        return reject(err);
                    resolve(url);
                });
            });
            agent.qrcode = url;
            await agent.save();
            qrcodeTerminal.generate(qr, { small: true });
        }
        catch (error) {
            console.error('Erro ao processar QR code:', error);
        }
    });
    client.on('authenticated', async () => {
        try {
            console.log(`AUTHENTICATED ${agent.name}`);
            agent.status = 'Authentication';
            agent.statusconnected = true;
            agent.number_phone = client.info?.wid?.user || null;
            agent.qrcode = null;
            await agent.save();
        }
        catch (error) {
            console.error('Erro ao atualizar agente após autenticação:', error);
        }
    });
    client.on('auth_failure', async (msg) => {
        console.error('AUTHENTICATION FAILURE', msg);
        stopAllLoops(agent.id);
        try {
            agent.status = 'Auth failure';
            agent.statusconnected = false;
            await agent.save();
        }
        catch (e) {
            console.error(`[${agent.id}] ERRO AO SALVAR Agent em auth_failure:`, e);
        }
    });
    client.on('ready', async () => {
        try {
            console.log(`READY... ${agent.name}`);
            const state = await client.getState();
            console.log('State:', state);
            const infoClient = await client.info;
            console.log('Client:', infoClient.pushname, '- Phone number:', infoClient.wid?.user);
            agent.status = state;
            agent.statusconnected = true;
            agent.number_phone = infoClient?.wid?.user || null;
            agent.qrcode = null;
            await agent.save();
            startSendLoop(client, agent);
            if (process.env.SELF_CONVERSATION?.toLowerCase() === 'true') {
                startInternalLoop(client, agent);
            }
        }
        catch (error) {
            console.error('Erro durante o evento "ready":', error);
        }
    });
    const chatMonitoring = new ChatMonitoring_1.default();
    await chatMonitoring.monitoring(client, agent);
    if (process.env.SELF_CONVERSATION?.toLowerCase() === 'true') {
        const chatMonitoringInternal = new ChatMonitoringInternal_1.default();
        await chatMonitoringInternal.monitoring(client);
    }
    client.on('message_ack', async (msg, ack) => {
        if (ack >= 2) {
            await Chat_1.default.query()
                .where('message', msg.body)
                .andWhere('cellphoneserialized', msg.to)
                .andWhere('chatnumber', 'like', String(msg.from).replace(/\D/g, ''))
                .update({ ack: msg.ack });
            await Talk_1.default.query()
                .where('message', msg.body)
                .andWhere('cellphoneserialized', msg.to)
                .andWhere('chatnumber', 'like', String(msg.from).replace(/\D/g, ''))
                .update({ message_ack: msg.ack });
        }
    });
    client.on('change_state', (state) => {
        console.log(`[${agent.id}] STATE =>`, state);
    });
    client.on('disconnected', async (reason) => {
        stopAllLoops(agent.id);
        try {
            console.log(`[${agent.id}] DISCONNECTED =>`, reason);
            let reasonText;
            if (typeof reason === 'string')
                reasonText = reason;
            else {
                try {
                    reasonText = JSON.stringify(reason);
                }
                catch {
                    reasonText = 'Unable to stringify reason';
                }
            }
            reasonText = reasonText.slice(0, 500);
            await Log_1.default.create({
                name: 'Verify Connection in Api5555',
                message: reasonText,
                description: `${agent.id} desconectado`,
            });
            agent.status = 'Disconnected';
            agent.statusconnected = false;
            await agent.save();
        }
        catch (error) {
            console.error(`[${agent.id}] ERRO AO PROCESSAR DISCONNECT:`, error);
        }
        try {
            const message = `O número ${agent.number_phone} foi desconectado!!!!`;
            await (0, util_1.sendMessageWarning)('553185228619@c.us', message);
        }
        catch (notifyErr) {
            console.error(`[${agent.id}] ERRO AO ENVIAR AVISO:`, notifyErr);
        }
    });
    WhatsAppClientManager_1.default.addClient(agent.id.toString(), client);
    let rejectCalls = true;
    client.on('call', async (call) => {
        if (rejectCalls)
            await call.reject();
        await client.sendMessage(call.from, `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`);
        await Talk_1.default.create({
            cellphone: call.from,
            chatnumber: client.info.wid._serialized,
            message: `Olá tudo Bem? Sou uma atendente virtual e por isso não consigo receber chamadas. Desculpe!!☺️`,
            type: 'from',
        });
    });
    return client;
}
exports.startAgent = startAgent;
//# sourceMappingURL=whatsappConnection.js.map