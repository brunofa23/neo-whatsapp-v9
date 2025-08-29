"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendMessage = exports.sendRepeatedMessageKlingo = exports.destroyFullAgents = exports.resetStatusConnected = exports.sendRepeatedMessage = exports.connectionAll = void 0;
const AgentsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/AgentsController"));
const DatasourcesController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/DatasourcesController"));
const DatasourceApisController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/DatasourceApisController"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const PersistShippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/PersistShippingcampaign"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const luxon_1 = require("luxon");
const util_1 = require("../app/Services/whatsapp-web/util");
const whatsapp_1 = require("../app/Services/whatsapp-web/whatsapp");
const whatsappConnection_1 = require("../app/Services/whatsapp-web/whatsappConnection");
require("../app/Services/plugins/axios");
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
async function destroyFullAgents() {
    console.log("Passei no destroy agentes 1222");
    const destroyAgents = new AgentsController_1.default;
    await destroyAgents.destroyFullAgents();
}
exports.destroyFullAgents = destroyFullAgents;
async function connectionAll() {
    try {
        console.log("connection all acionado...");
        await Agent_1.default.query().update({ statusconnected: false, qrcode: null });
        const agents = await Agent_1.default.query().where('active', true).andWhereNull('deleted').orWhere('deleted', false);
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
exports.connectionAll = connectionAll;
async function sendRepeatedMessage() {
    console.log("EXECUTANDO BUSCA SMART");
    setInterval(async () => {
        const targetDates = (0, util_1.getTargetDates)();
        if (await (0, util_1.TimeSchedule)()) {
            for (const date of targetDates) {
                const formatted = date.toFormat('yyyy-MM-dd');
                console.log(`Buscando dados no Smart(Server): ${formatted}`);
                await (0, PersistShippingcampaign_1.default)(formatted);
            }
            const datasourcesController = new DatasourcesController_1.default;
            await datasourcesController.confirmScheduleAll();
            await datasourcesController.cancelScheduleAll();
        }
    }, Number(process.env.TIME_SENDREPEATEDMESSAGE || 50000));
}
exports.sendRepeatedMessage = sendRepeatedMessage;
async function resendMessage() {
    setInterval(async () => {
        try {
            console.log("passei no RESEND............................");
            const now = luxon_1.DateTime.now();
            const yesterdayStart = now.minus({ days: 1 }).startOf('day');
            const yesterdayEnd = now.minus({ days: 1 }).endOf('day');
            const tomorrowStart = now.plus({ days: 1 }).startOf('day');
            const tomorrowEnd = now.plus({ days: 1 }).endOf('day');
            const updatedResend = await Shippingcampaign_1.default.query()
                .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
                .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
                .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
                .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
                .andWhere('interaction_id', 1)
                .whereNull('phonevalid')
                .andWhere('messagesent', 0)
                .andWhereNull('excluded')
                .update({
                createdAt: luxon_1.DateTime.now().toSQL({ includeOffset: false }),
                resend: 1
            });
            const records = await Shippingcampaign_1.default.query()
                .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
                .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
                .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
                .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
                .andWhere('interaction_id', 2)
                .whereNull('phonevalid')
                .andWhere('messagesent', 0)
                .andWhereNull('excluded')
                .limit(100)
                .select('id');
            const ids = records.map(r => r.id);
            if (ids.length > 0) {
                await Shippingcampaign_1.default.query()
                    .whereIn('id', ids)
                    .update({
                    createdAt: luxon_1.DateTime.now().toSQL({ includeOffset: false }),
                    resend: 1
                });
            }
            if (updatedResend[0] > 0) {
                await Log_1.default.create({
                    name: "Resend",
                    message: `Reenvio de mensagens não enviadas. Total: ${updatedResend}`,
                    description: "Function: resendMessage"
                });
            }
        }
        catch (error) {
            console.error("Erro no resendMessage:", error);
            await Log_1.default.create({
                name: "ResendError",
                message: error.message || "Erro desconhecido",
                description: error.stack || "Sem stack trace"
            });
        }
    }, 5 * 60 * 60 * 1000);
}
exports.resendMessage = resendMessage;
async function sendRepeatedMessageKlingo() {
    console.log("EXECUTANDO BUSCA KLINGO");
    setInterval(async () => {
        let date = luxon_1.DateTime.local().setZone('America/Sao_Paulo').plus({ days: 3 });
        if (date.weekday === 6) {
            date = date.plus({ days: 2 });
        }
        else if (date.weekday === 7) {
            date = date.plus({ days: 1 });
        }
        date = date.toFormat("yyyy-MM-dd");
        if (await (0, util_1.TimeSchedule)()) {
            console.log(`Buscando dados no Klingo: ${date}`);
            const datasourceApisController = new DatasourceApisController_1.default;
            datasourceApisController.getSchedulesInternal(date);
        }
    }, Number(process.env.TIME_SENDREPEATEDMESSAGE || 5000));
    setInterval(async () => {
        if (await (0, util_1.TimeSchedule)()) {
            console.log(`Atualizando confirmações no Klingo: ${luxon_1.DateTime.now().toFormat("dd/MM/yyyy HH:mm")}`);
            const datasourceApisController = new DatasourceApisController_1.default;
            datasourceApisController.confirmOrCancelScheduleInternal();
        }
    }, await (0, util_1.GenerateRandomTime)(500, 550, '****Send Message Repeated'));
}
exports.sendRepeatedMessageKlingo = sendRepeatedMessageKlingo;
async function resetStatusConnected() {
    await Agent_1.default.query().update({ status: null, statusconnected: false });
}
exports.resetStatusConnected = resetStatusConnected;
//# sourceMappingURL=events.js.map