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
require("../app/Services/plugins/axios");
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const gupshupConnection_1 = require("../app/Services/whatsapp-gupshup/gupshupConnection");
let lastLogCleanupAt = 0;
const LOG_CLEANUP_COOLDOWN_MS = 6 * 60 * 60 * 1000;
async function cleanupLogs15Days(force = false) {
    try {
        const now = Date.now();
        if (!force && now - lastLogCleanupAt < LOG_CLEANUP_COOLDOWN_MS)
            return;
        lastLogCleanupAt = now;
        const cutoff = luxon_1.DateTime.now()
            .minus({ days: 15 })
            .toSQL({ includeOffset: false });
        const deleted = await Log_1.default.query()
            .where("created_at", "<", cutoff)
            .delete();
        if (deleted && Number(deleted) > 0) {
            console.log(`[LogCleanup] removidos ${deleted} logs anteriores a ${cutoff}`);
        }
    }
    catch (err) {
        console.error("[LogCleanup] erro ao limpar logs:", err);
    }
}
async function destroyFullAgents() {
    console.log("Passei no destroy agentes 1222");
    const destroyAgents = new AgentsController_1.default();
    await destroyAgents.destroyFullAgents();
}
exports.destroyFullAgents = destroyFullAgents;
async function connectionAll() {
    try {
        console.log("connection all acionado...");
        await Agent_1.default.query().update({ statusconnected: false, qrcode: null });
        const agents = await Agent_1.default.query()
            .where("active", true)
            .where((q) => q.whereNull("deleted").orWhere("deleted", false));
        for (const agent of agents) {
            if (!agent)
                continue;
            const provider = (agent.provider_type || "wwebjs").toLowerCase();
            if (agent.default_chat) {
                console.log(`Conectando Agente Default: ${agent.name}`);
                await Agent_1.default.query().where("id", agent.id).update({
                    status: "GUPSHUP",
                    statusconnected: true,
                    qrcode: null,
                });
                continue;
            }
            if (provider === "gupshup") {
                console.log(`Conectando Agente Envio (GUPSHUP): ${agent.name}`);
                await Agent_1.default.query().where("id", agent.id).update({
                    status: "GUPSHUP",
                    statusconnected: true,
                    qrcode: null,
                });
                (0, gupshupConnection_1.startGupshupLoop)(agent);
                continue;
            }
            console.log(`Conectando Agente Envio (WEBJS): ${agent.name}`);
        }
    }
    catch (error) {
        console.error("Erro em connectionAll:", error);
    }
}
exports.connectionAll = connectionAll;
async function sendRepeatedMessage() {
    console.log("EXECUTANDO BUSCA SMART");
    const raw = Number(process.env.TIME_SENDREPEATEDMESSAGE);
    const intervalMs = Number.isFinite(raw) && raw >= 5000 ? raw : 50000;
    let running = false;
    const scheduleNext = () => setTimeout(tick, intervalMs);
    const tick = async () => {
        if (running) {
            console.log("[sendRepeatedMessage] tick ignorado (execução anterior ainda em andamento)");
            scheduleNext();
            return;
        }
        running = true;
        const startedAt = Date.now();
        try {
            await cleanupLogs15Days();
            const targetDates = (0, util_1.getTargetDates)();
            if (await (0, util_1.TimeSchedule)()) {
                for (const date of targetDates) {
                    const formatted = date.toFormat("yyyy-MM-dd");
                    console.log(`Buscando dados no Smart(Server) [interaction=1]: ${formatted}`);
                    await (0, PersistShippingcampaign_1.default)(formatted, false, 1);
                }
                console.log(`Buscando dados no Smart(Server) [interaction=2]`);
                await (0, PersistShippingcampaign_1.default)(luxon_1.DateTime.now().setZone("America/Sao_Paulo").toFormat("yyyy-MM-dd"), false, 2);
                console.log(`Buscando dados no Smart(Server) [interaction=3]`);
                await (0, PersistShippingcampaign_1.default)(luxon_1.DateTime.now().setZone("America/Sao_Paulo").toFormat("yyyy-MM-dd"), false, 3);
                const datasourcesController = new DatasourcesController_1.default();
                await datasourcesController.confirmScheduleAll();
                await datasourcesController.cancelScheduleAll();
            }
        }
        catch (err) {
            console.error("[sendRepeatedMessage] erro no ciclo:", err);
        }
        finally {
            running = false;
            const elapsed = Date.now() - startedAt;
            console.log(`[sendRepeatedMessage] ciclo finalizado em ${elapsed}ms`);
            scheduleNext();
        }
    };
    void tick();
}
exports.sendRepeatedMessage = sendRepeatedMessage;
async function sendRepeatedMessageKlingo() {
    console.log("PASSO 1 KLINGO...");
    const zone = "America/Sao_Paulo";
    const parseIntervalMs = (raw, fallback = 5000) => {
        const n = Number(raw);
        return Number.isFinite(n) && n >= 1000 ? n : fallback;
    };
    const computeTargetDate = () => {
        const today = luxon_1.DateTime.local().setZone(zone);
        const daysToAdd = today.weekday >= 1 && today.weekday <= 4
            ? 2
            : today.weekday === 5
                ? 3
                : today.weekday === 6
                    ? 3
                    : null;
        if (daysToAdd === null)
            return null;
        return today.plus({ days: daysToAdd }).toFormat("yyyy-MM-dd");
    };
    const intervalMs = parseIntervalMs(process.env.TIME_SENDREPEATEDMESSAGE, 5000);
    let schedulesTimer = null;
    let schedulesRunning = false;
    const schedulesTick = async () => {
        schedulesTimer = setTimeout(schedulesTick, intervalMs);
        if (schedulesRunning) {
            console.log("[Klingo][getSchedules] tick ignorado (execução anterior em andamento)");
            return;
        }
        schedulesRunning = true;
        try {
            await cleanupLogs15Days();
            const date = computeTargetDate();
            if (!date)
                return;
            if (await (0, util_1.TimeSchedule)()) {
                console.log(`Buscando dados no Klingo: ${date}`);
                console.log("PASSO 2 KLINGO...");
                const datasourceApisController = new DatasourceApisController_1.default();
                console.log("PASSO 3 KLINGO...");
                await datasourceApisController.getSchedulesInternal(date);
                console.log("PASSO 4 KLINGO...");
            }
        }
        catch (err) {
            console.error("[Klingo][getSchedules] erro:", err);
        }
        finally {
            schedulesRunning = false;
        }
    };
    let confirmTimer = null;
    let confirmRunning = false;
    const confirmTick = async () => {
        let nextMs = 5000;
        try {
            nextMs = await (0, util_1.GenerateRandomTime)(500, 550, "****Send Message Repeated");
        }
        catch (e) {
            nextMs = 30000;
        }
        confirmTimer = setTimeout(confirmTick, nextMs);
        if (confirmRunning) {
            console.log("[Klingo][confirmOrCancel] tick ignorado (execução anterior em andamento)");
            return;
        }
        confirmRunning = true;
        try {
            await cleanupLogs15Days();
            if (await (0, util_1.TimeSchedule)()) {
                console.log(`Atualizando confirmações no Klingo: ${luxon_1.DateTime.now()
                    .setZone(zone)
                    .toFormat("dd/MM/yyyy HH:mm")}`);
                const datasourceApisController = new DatasourceApisController_1.default();
                await datasourceApisController.confirmOrCancelScheduleInternal();
            }
        }
        catch (err) {
            console.error("[Klingo][confirmOrCancel] erro:", err);
        }
        finally {
            confirmRunning = false;
        }
    };
    schedulesTick();
    confirmTick();
    return {
        stop() {
            if (schedulesTimer)
                clearTimeout(schedulesTimer);
            if (confirmTimer)
                clearTimeout(confirmTimer);
            schedulesTimer = null;
            confirmTimer = null;
        },
    };
}
exports.sendRepeatedMessageKlingo = sendRepeatedMessageKlingo;
async function resendMessage() {
    const intervalMs = 4 * 60 * 60 * 1000;
    let running = false;
    const tick = async () => {
        if (running) {
            console.log("[resendMessage] tick ignorado (execução anterior ainda em andamento)");
            return;
        }
        running = true;
        try {
            console.log("passei no RESEND............................");
            const now = luxon_1.DateTime.now();
            const yesterdayStart = now.minus({ days: 1 }).startOf("day");
            const yesterdayEnd = now.minus({ days: 1 }).endOf("day");
            const tomorrowStart = now.plus({ days: 1 }).startOf("day");
            const tomorrowEnd = now.plus({ days: 1 }).endOf("day");
            const nowSql = luxon_1.DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss");
            const updatedResendResult = await Shippingcampaign_1.default.query()
                .where("created_at", ">=", yesterdayStart.toSQL({ includeOffset: false }))
                .where("created_at", "<=", yesterdayEnd.toSQL({ includeOffset: false }))
                .where("dateshedule", ">=", tomorrowStart.toSQL({ includeOffset: false }))
                .where("dateshedule", "<=", tomorrowEnd.toSQL({ includeOffset: false }))
                .andWhere("interaction_id", 1)
                .whereNull("phonevalid")
                .andWhere("messagesent", 0)
                .andWhereNull("excluded")
                .update({
                createdAt: nowSql,
                resend: 1,
            });
            const updatedResend = typeof updatedResendResult === "number"
                ? updatedResendResult
                : Number(updatedResendResult?.[0] ?? 0);
            const records = await Shippingcampaign_1.default.query()
                .where("created_at", ">=", yesterdayStart.toSQL({ includeOffset: false }))
                .where("created_at", "<=", yesterdayEnd.toSQL({ includeOffset: false }))
                .andWhere("interaction_id", 2)
                .whereNull("phonevalid")
                .andWhere("messagesent", 0)
                .andWhereNull("excluded")
                .limit(60)
                .select("id");
            const ids = records.map((r) => r.id);
            if (ids.length > 0) {
                await Shippingcampaign_1.default.query().whereIn("id", ids).update({
                    createdAt: nowSql,
                    resend: 1,
                });
            }
        }
        catch (error) {
            console.error("Erro no resendMessage:", error);
        }
        finally {
            running = false;
        }
    };
    setInterval(() => void tick(), intervalMs);
    void tick();
}
exports.resendMessage = resendMessage;
async function resetStatusConnected() {
    await Agent_1.default.query().update({ status: null, statusconnected: false });
}
exports.resetStatusConnected = resetStatusConnected;
//# sourceMappingURL=events.js.map