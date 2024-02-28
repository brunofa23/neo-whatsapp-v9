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
const fs = require('fs');
class AgentsController {
    async index({ response }) {
        const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
        const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
        try {
            const data = await Agent_1.default.query();
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
                    totMessage: totMessage?.$extras.totMessage
                });
            }
            return response.status(200).send(agents);
        }
        catch (error) {
            return error;
        }
    }
    async store({ request, response }) {
        const body = request.only(Agent_1.default.fillable);
        body.interval_init_query = 1;
        body.interval_final_query = 1;
        try {
            const data = await Agent_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async update({ params, request, response }) {
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
    async connection({ params, request, response }) {
        try {
            const valuedatetime = luxon_1.DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss');
            await Config_1.default.query().where('id', 'statusSendMessage').update({ valuedatetime: valuedatetime });
            await Agent_1.default.query()
                .where('id', params.id)
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
    async connectionAll({ params, request, response }) {
        try {
            console.log("connection all acionado...");
            const valuedatetime = luxon_1.DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss');
            await Config_1.default.query().where('id', 'statusSendMessage').update({ valuedatetime: valuedatetime });
            await Agent_1.default.query().update({ statusconnected: false, qrcode: null });
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
    async destroy({ params, request, response }) {
        const id = params.id;
        const pathFolder = `.wwebjs_auth/session-${id}`;
        if (fs.existsSync(pathFolder)) {
            fs.rm(pathFolder, { recursive: true }, (err) => {
                if (err) {
                    console.error(err);
                }
                else {
                    console.log("DIRETORIO DELETADO");
                }
            });
        }
        const data = await Agent_1.default.findOrFail(id);
        await data.delete();
        return {
            message: "Agente excluido com sucesso!!",
            data: data
        };
    }
}
exports.default = AgentsController;
//# sourceMappingURL=AgentsController.js.map