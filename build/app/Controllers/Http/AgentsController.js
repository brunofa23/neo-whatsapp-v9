"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const whatsappConnection_1 = require("../../Services/whatsapp-web/whatsappConnection");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const util_1 = require("../../Services/whatsapp-web/util");
const luxon_1 = require("luxon");
const whatsapp_1 = require("../../Services/whatsapp-web/whatsapp");
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = __importDefault(require("fs"));
const WhatsAppClientManager_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/WhatsAppClientManager"));
function deleteFolder(pathFolder) {
    return new Promise((resolve, reject) => {
        fs_1.default.rm(pathFolder, { recursive: true }, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
class AgentsController {
    async index({ auth, response }) {
        await auth.use('api').authenticate();
        const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
        const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
        try {
            const data = await Agent_1.default.query().whereNull('deleted');
            const agents = [];
            for (const agent of data) {
                const totMessage = await Chat_1.default.query()
                    .where('chatname', agent.name)
                    .andWhereBetween('created_at', [dateStart, dateEnd])
                    .count('* as totMessage').first();
                agents.push({
                    id: agent.id,
                    name: agent.name,
                    number_phone: agent.number_phone,
                    interval_init_query: agent.interval_init_query,
                    interval_final_query: agent.interval_final_query,
                    interval_init_message: agent.interval_init_message,
                    interval_final_message: agent.interval_final_message,
                    max_limit_message: agent.max_limit_message,
                    status: agent.status,
                    statusconnected: agent.statusconnected,
                    active: agent.active,
                    default_chat: agent.default_chat,
                    qrcode: agent.qrcode,
                    company_id: agent.company_id,
                    obs: agent.obs,
                    totMessage: totMessage?.$extras.totMessage
                });
            }
            return response.status(200).send(agents);
        }
        catch (error) {
            return error;
        }
    }
    async store({ auth, request, response }) {
        await auth.use('api').authenticate();
        const body = request.only(Agent_1.default.fillable);
        body.interval_init_query = 1;
        body.interval_final_query = 1;
        body.active = 1;
        try {
            const data = await Agent_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        const body = request.only(Agent_1.default.fillable);
        try {
            const data = await Agent_1.default.query().where('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async connection({ auth, params, response }) {
        await auth.use('api').authenticate();
        try {
            const valuedatetime = luxon_1.DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss');
            await Config_1.default.query().where('id', 'statusSendMessage').update({ valuedatetime: valuedatetime });
            await Agent_1.default.query()
                .where('id', params.id)
                .andWhereNull('deleted')
                .update({ statusconnected: false, qrcode: null });
            const agent = await Agent_1.default.query().where('id', params.id).first();
            let client;
            if (agent) {
                if (agent.default_chat) {
                    console.log(`Conectando Agente Default: ${agent.name}`);
                    client = await (0, whatsapp_1.startAgentChat)(agent);
                }
                else {
                    console.log(`Conectando Agente Envio: ${agent.name} `);
                    client = await (0, whatsappConnection_1.startAgent)(agent);
                }
            }
            return response.status(201).send('Connected', client);
        }
        catch (error) {
            error;
        }
    }
    async connectionAll({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        try {
            console.log("connection all acionado...");
            const valuedatetime = luxon_1.DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss');
            await Config_1.default.query().where('id', 'statusSendMessage').update({ valuedatetime: valuedatetime });
            await Agent_1.default.query()
                .whereNull('deleted')
                .update({ statusconnected: false, qrcode: null });
            const agents = await Agent_1.default.query()
                .where('active', true);
            for (const agent of agents) {
                if (agent) {
                    if (agent.default_chat) {
                        console.log(`Conectando Agente Default: ${agent.name} `);
                        await (0, whatsapp_1.startAgentChat)(agent);
                    }
                    else {
                        console.log(`Conectando Agente Envio: ${agent.name} `);
                        await (0, whatsappConnection_1.startAgent)(agent);
                    }
                }
            }
        }
        catch (error) {
            error;
        }
    }
    async destroy({ auth, params, response }) {
        await auth.use('api').authenticate();
        console.log("passei no destroy....");
        await new Promise((resolve) => {
            setTimeout(async () => {
                console.log("Excluindo pasta...");
                const pathFolder = Application_1.default.tmpPath(`/sessions/session-${params.id}`);
                if (fs_1.default.existsSync(pathFolder)) {
                    try {
                        await deleteFolder(pathFolder);
                        console.log(`DIRETÓRIO DELETADO: session-${params.id}`);
                        await Agent_1.default.query().where('id', params.id).delete();
                        resolve();
                    }
                    catch (err) {
                        console.error(err);
                        resolve();
                    }
                }
                else {
                    resolve();
                }
            }, 10000);
        });
        const data = await Agent_1.default.query().where('id', params.id)
            .update({ deleted: true, active: null, status: null, number_phone: null, qrcode: null });
        return response.status(201).send(data);
    }
    async destroyFullAgents() {
        const agents = await Agent_1.default.query().where('deleted', true);
        for (const agent of agents) {
            await new Promise((resolve) => {
                setTimeout(async () => {
                    console.log("Excluindo pasta...");
                    const pathFolder = Application_1.default.tmpPath(`/sessions/session-${agent.id}`);
                    if (fs_1.default.existsSync(pathFolder)) {
                        try {
                            await deleteFolder(pathFolder);
                            console.log(`DIRETÓRIO DELETADO: session-${agent.id}`);
                            await Agent_1.default.query().where('id', agent.id).delete();
                            resolve();
                        }
                        catch (err) {
                            console.error(err);
                            resolve();
                        }
                    }
                    else {
                        resolve();
                    }
                }, 10000);
            });
        }
        await Agent_1.default.query().where('deleted', true).delete();
    }
    async verifyStatusAgent({ request, response }) {
        const { option, cellphone, agent } = request.only(['option', 'cellphone', 'agent']);
        const client = WhatsAppClientManager_1.default.getClient(agent);
        console.log("CLIENTE:", client);
        console.log("Agent recebido:", agent);
        console.log("Todos os clients no manager:", WhatsAppClientManager_1.default.getAllClients());
        console.log("option:", option);
        if (option == 2) {
            console.log("OPÇÃO 2 - Info do cliente");
            const result = client.info;
            return response.send({ retorno: result });
        }
        if (option == 3) {
            console.log("OPÇÃO 3 - Estado da sessão");
            const result = await client.getState();
            return response.send({ retorno: result });
        }
        if (option == 4) {
            console.log("OPÇÃO 4 - Todos os contatos");
            const result = await client.getContacts();
            return response.send({ retorno: result });
        }
        if (option == 5) {
            console.log("OPÇÃO 5 - Número formatado");
            const result = await client.getFormattedNumber(`${cellphone}`);
            return response.send({ retorno: result });
        }
        if (option == 6) {
            console.log("OPÇÃO 6 - Verificar se é usuário WhatsApp");
            const result = await client.isRegisteredUser(`${cellphone}@c.us`);
            return response.send({ retorno: result });
        }
        if (option == 7) {
            console.log("OPÇÃO 7 - Buscar contato");
            const result = await client.getContactById(`${cellphone}@c.us`);
            return response.send({ retorno: result });
        }
        if (option == 8) {
            console.log("OPÇÃO 8 - Enviar mensagem");
            const result = await client.sendMessage(`${cellphone}@c.us`, 'Olá! Esta é uma mensagem automática.');
            return response.send({ retorno: result });
        }
        if (option == 9) {
            console.log("OPÇÃO 9 - Marcar como visto");
            const result = await client.sendSeen('31985228619@c.us');
            return response.send({ retorno: result });
        }
        if (option == 10) {
            console.log("OPÇÃO 10 - Obter todos os chats");
            const result = await client.getChats();
            return response.send({ retorno: result });
        }
        if (option == 11) {
            console.log("OPÇÃO 11 - Obter chat por ID");
            const result = await client.getChatById(`${cellphone}@c.us`);
            return response.send({ retorno: result });
        }
        if (option == 12) {
            console.log("OPÇÃO 12 - Obter foto de perfil");
            const result = await client.getProfilePicUrl(`${cellphone}@c.us`);
            return response.send({ retorno: result });
        }
        if (option == 13) {
            console.log("OPÇÃO 13 - Destroy (desconectar)");
            const result = await client.destroy();
            return response.send({ retorno: result });
        }
        if (option == 14) {
            console.log("OPÇÃO 14 - Versão do WhatsApp Web");
            const result = await client.getWWebVersion();
            return response.send({ retorno: result });
        }
        if (option == 15) {
            console.log("OPÇÃO 1 - Logout");
            const result = await client.logout();
            return response.send({ retorno: result });
        }
        if (option == 16) {
            console.log("OPÇÃO 13 - Destroy (desconectar)");
            const result = await client.destroy();
            return response.send({ retorno: result });
        }
        if (option == 17) {
            console.log("OPÇÃO 17 - TROCA O NOME");
            const result = await client.setDisplayName('Novo Nome');
            return response.send({ retorno: result });
        }
        if (option == 18) {
            console.log("OPÇÃO 18 - TROCA O STATUS");
            const result = await client.setStatus('Disponível para atendimento!');
            return response.send({ retorno: result });
        }
        if (option == 19) {
            console.log("OPÇÃO 18 - reiniciar");
            const result = await client.initialize();
            return response.send({ retorno: result });
        }
    }
}
exports.default = AgentsController;
//# sourceMappingURL=AgentsController.js.map