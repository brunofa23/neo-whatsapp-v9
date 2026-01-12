"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
const Unit_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Unit"));
const request_1 = global[Symbol.for('ioc.use')]("App/Services/requestExternal/request");
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
const ResponsesController_1 = __importDefault(require("./ResponsesController"));
const luxon_1 = require("luxon");
async function greeting(message, schedule) {
    const responseList = new ResponsesController_1.default();
    const greeting = await responseList.index({ local: 'greeting' });
    const presentation = await responseList.index({ local: 'presentation' });
    const askschedule = await responseList.index({ local: 'askschedule' });
    const gender = schedule.sexo == "M" ? "Sr." : "Sra.";
    const date_schedule_message = luxon_1.DateTime.fromFormat(schedule.datahora, "yyyy-MM-dd HH:mm").toFormat("dd/MM/yyyy HH:mm");
    const name_message = String(schedule.nome).trim().split(' ')[0];
    const medic = String(schedule.medico).trim().split(' ')[0];
    const name_unit = String(schedule.unidade);
    return String(message.replace('{greeting}', greeting)
        .replace('{presentation}', presentation)
        .replace('{askschedule}', askschedule)
        .replace('{gender}', gender)
        .replace('{name_message}', name_message)
        .replace('{medic}', medic)
        .replace('{name_unit}', name_unit)
        .replace('{date_schedule_message}', date_schedule_message)).replace(/@p[0-9]/g, '?');
}
async function otherFields(schedule) {
    let payLoad;
    let value;
    if (schedule && schedule.unidade_id) {
        payLoad = await Unit_1.default.query().where('id_unit', schedule.unidade_id).first();
        return value = `{"address_unit":"${payLoad?.address}","medic":"${String(schedule.medico).trim()}","schedule":"${schedule.datahora}","phone_unit":"${payLoad?.phone}","name_unit":"${payLoad?.name}"}`;
    }
    return null;
}
function prepareSchedules(records) {
    if (!Array.isArray(records)) {
        console.log('[prepareSchedules] records inválido (não é array):', records);
        return [];
    }
    const filtered = records.filter((item) => {
        if (!item || typeof item !== 'object')
            return false;
        const it = item;
        return it.status_confirmacao_id == null && it.id_paciente != null && it.datahora != null;
    });
    if (filtered.length === 0)
        return [];
    const groupedByPatient = filtered.reduce((acc, record) => {
        const key = String(record.id_paciente);
        (acc[key] ?? (acc[key] = [])).push(record);
        return acc;
    }, {});
    const oldestRecords = Object.values(groupedByPatient).map((group) => {
        const allIds = group.map((item) => item.id_marcacao);
        const oldest = group.reduce((oldest, current) => {
            const tOld = Date.parse(String(oldest.datahora));
            const tCur = Date.parse(String(current.datahora));
            if (!Number.isFinite(tCur))
                return oldest;
            if (!Number.isFinite(tOld))
                return current;
            return tCur < tOld ? current : oldest;
        });
        return { ...oldest, idexternal_array: allIds };
    });
    return oldestRecords;
}
async function returnIdExternal(chatObject) {
    if (chatObject?.shippingcamapgn?.idexternal_array) {
        return chatObject.shippingcamapgn.idexternal_array
            .split(',')
            .map(item => parseInt(item.trim(), 10))
            .filter(item => !isNaN(item));
    }
    else {
        return [chatObject.idexternal];
    }
}
class DatasourceApisController {
    async getSchedulesInternal(date) {
        const formatKlingoDate = (datahora) => {
            const raw = String(datahora ?? "").trim();
            if (!raw)
                return "";
            const iso = luxon_1.DateTime.fromISO(raw, { zone: "America/Sao_Paulo" });
            if (iso.isValid)
                return iso.toFormat("dd/LL/yyyy HH:mm");
            const fmt1 = luxon_1.DateTime.fromFormat(raw, "yyyy-MM-dd HH:mm", { zone: "America/Sao_Paulo" });
            if (fmt1.isValid)
                return fmt1.toFormat("dd/LL/yyyy HH:mm");
            const fmt2 = luxon_1.DateTime.fromFormat(raw, "yyyy-MM-dd HH:mm:ss", { zone: "America/Sao_Paulo" });
            if (fmt2.isValid)
                return fmt2.toFormat("dd/LL/yyyy HH:mm");
            return raw;
        };
        const schedule_list = await prepareSchedules(await (0, request_1.getSchedulesApi)(date));
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", schedule_list);
        const date_start = luxon_1.DateTime.now().setZone("America/Sao_Paulo").startOf("day").toSQL({ includeOffset: false });
        for (const data of schedule_list) {
            try {
                const regStr = String(data.id_paciente ?? "").replace(/[^0-9]/g, "");
                if (!regStr)
                    continue;
                const firstName = String(data.nome ?? "").trim().split(/\s+/)[0] || "";
                const shipping = new Shippingcampaign_1.default();
                shipping.interaction_id = 1;
                shipping.interaction_seq = 1;
                shipping.reg = parseInt(regStr, 10);
                shipping.dateshedule = data.datahora;
                shipping.idexternal = data.id_marcacao;
                shipping.name = String(data.nome ?? "").trim();
                shipping.cellphone = String(data.celular ?? "").replace(/[^0-9]+/g, "");
                const normalizedPhone = await (0, util_1.ValidatePhone)(shipping.cellphone);
                shipping.phonevalid = normalizedPhone ? true : null;
                shipping.messagesent = false;
                shipping.message = await greeting(String(`{greeting} {presentation} {askschedule}`), data);
                shipping.otherfields = String(await otherFields(data));
                shipping.doctor = String(data.medico ?? "").trim();
                shipping.unit = String(data.unidade ?? "").trim();
                shipping.covenant = "";
                shipping.idexternal_array = String(data.idexternal_array ?? "");
                const gupParamsArr = [
                    firstName,
                    formatKlingoDate(data.datahora),
                    shipping.unit,
                    shipping.doctor,
                ];
                shipping.gupshupParams = JSON.stringify(gupParamsArr);
                const verifyExist = await Shippingcampaign_1.default.query()
                    .where("reg", shipping.reg)
                    .andWhere("dateshedule", data.datahora)
                    .andWhere("created_at", ">=", date_start)
                    .first();
                if (!verifyExist) {
                    await Shippingcampaign_1.default.create(shipping);
                }
            }
            catch (error) {
                console.log("Erro 44454>>>>", error);
                return false;
            }
        }
        return true;
    }
    async confirmOrCancelScheduleInternal() {
        const date_start = luxon_1.DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm");
        const date_end = luxon_1.DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm");
        try {
            const confirmCancel = await Chat_1.default.query()
                .preload('shippingcamapgn', (query) => {
                query.select('idexternal_array');
            })
                .whereBetween('created_at', [date_start, date_end])
                .andWhere('externalstatus', 'A')
                .andWhere('interaction_id', 1);
            if (!confirmCancel || confirmCancel.length === 0)
                return;
            const processSchedule = async (idExternal, status, message) => {
                for (const id of idExternal) {
                    const result = await (0, request_1.confirmOrCancelScheduleApi)(id, status, message);
                    if (!result) {
                        console.error(`659569 - Falha ao processar ${message} para ID:`, id);
                    }
                }
                return true;
            };
            for (const data of confirmCancel) {
                const idExternal = await returnIdExternal(data);
                if (!idExternal || idExternal.length === 0) {
                    continue;
                }
                if (data.absoluteresp === 1) {
                    await processSchedule(idExternal, 'C', 'Confirmado pelo EasyTalk');
                }
                else if (data.absoluteresp === 2) {
                    await processSchedule(idExternal, 'N', 'Não Confirmada pelo EasyTalk');
                }
                else {
                    await Log_1.default.create({ name: 'DataSourceApiController', message: error, description: `Resposta absoluta inválida para o registro:${data.id}` });
                }
                await Chat_1.default.query().where("id", data.id).update({ externalstatus: 'B' });
            }
        }
        catch (error) {
            console.error("14778 - Erro ao processar confirmações ou cancelamentos:", error);
        }
    }
    async getSchedules({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { date } = request.requestData;
        const payLoad = await this.getSchedulesInternal(date);
        return response.status(200).send(payLoad);
    }
    async confirmOrCancelSchedule({ auth }) {
        await auth.use('api').authenticate();
        await this.confirmOrCancelScheduleInternal();
    }
}
exports.default = DatasourceApisController;
//# sourceMappingURL=DatasourceApisController.js.map