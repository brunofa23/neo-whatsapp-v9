"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
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
class DatasourceApisController {
    async getSchedulesInternal(date) {
        const schedule_list = await (0, request_1.getSchedulesApi)(date);
        for (const data of schedule_list) {
            if (data.id_paciente == 5144 || data.id_paciente == 28724 || data.id_paciente == 5845 || data.id_paciente == 5178) {
                try {
                    const reg = String(data.id_paciente).replace(/[^0-9.-]/g, "");
                    const shipping = new Shippingcampaign_1.default();
                    shipping.interaction_id = 1;
                    shipping.interaction_seq = 1;
                    shipping.reg = parseInt(reg);
                    shipping.dateshedule = data.datahora;
                    shipping.idexternal = data.id_marcacao;
                    shipping.name = String(data.nome).trim();
                    shipping.cellphone = String(data.celular).replace(/[^0-9]+/g, '');
                    if (!await (0, util_1.ValidatePhone)(shipping.cellphone))
                        shipping.phonevalid = false;
                    shipping.messagesent = false;
                    shipping.message = await greeting(String(`{greeting},{presentation},{askschedule}`), data);
                    shipping.otherfields = String(await otherFields(data));
                    shipping.doctor = String(data.medico).trim();
                    shipping.unit = String(data.unidade).trim();
                    shipping.covenant = '';
                    const verifyExist = await Shippingcampaign_1.default.query().where('reg', reg)
                        .andWhere('dateshedule', data.datahora).first();
                    if (!verifyExist) {
                        await Shippingcampaign_1.default.create(shipping);
                    }
                }
                catch (error) {
                    console.log("Erro 44454>>>>", error);
                    return false;
                }
            }
        }
        return true;
    }
    async confirmOrCancelScheduleInternal() {
        const date_start = luxon_1.DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm");
        const date_end = luxon_1.DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm");
        try {
            const confirmCancel = await Chat_1.default.query()
                .whereBetween('created_at', [date_start, date_end])
                .andWhere('externalstatus', 'A')
                .andWhere('interaction_id', 1);
            if (!confirmCancel || confirmCancel.length === 0)
                return;
            let result;
            for (const data of confirmCancel) {
                console.log("Executando Confirmação e Cancelamento no Klingo");
                if (data.absoluteresp === 1) {
                    result = await (0, request_1.confirmOrCancelScheduleApi)(data.idexternal, 'C', 'Confirmado');
                }
                else if (data.absoluteresp === 2) {
                    result = await (0, request_1.confirmOrCancelScheduleApi)(data.idexternal, 'N', 'Não Confirmada');
                }
                if (result)
                    await Chat_1.default.query().where("id", data.id).update({ externalstatus: 'B' });
            }
        }
        catch (error) {
            console.error("Erro ao processar confirmações ou cancelamentos:", error);
        }
    }
    async getSchedules({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { date } = request.requestData;
        await this.getSchedulesInternal(date);
        return response.status(200).send("OK");
    }
    async confirmOrCancelSchedule({ auth }) {
        await auth.use('api').authenticate();
        await this.confirmOrCancelScheduleInternal();
    }
}
exports.default = DatasourceApisController;
//# sourceMappingURL=DatasourceApisController.js.map