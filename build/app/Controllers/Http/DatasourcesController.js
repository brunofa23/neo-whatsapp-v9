"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Interaction_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Interaction"));
const luxon_1 = require("luxon");
const moment_1 = __importDefault(require("moment"));
const request_1 = require("../../Services/requestExternal/request");
const util_1 = require("../../Services/whatsapp-web/util");
const ResponsesController_1 = __importDefault(require("./ResponsesController"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
class DatasourcesController {
    async DataSource(date, interaction_id = 0, unit = 0) {
        try {
            let schedulePatientsArray = [];
            let serviceEvaluationArray = [];
            if (interaction_id === 1) {
                return await this.scheduledPatients(date, unit);
            }
            if (interaction_id === 2) {
                return await this.serviceEvaluation();
            }
            const interactionList = await Interaction_1.default.query().where('status', 1);
            for (const interaction of interactionList) {
                switch (interaction.id) {
                    case 1:
                        schedulePatientsArray = await this.scheduledPatients(date);
                        break;
                    case 2:
                        serviceEvaluationArray = await this.serviceEvaluation();
                        break;
                    case 3:
                        console.log("Teste de envio amadurecimento do chip", interaction.name);
                        break;
                    default:
                        console.warn(`ID de interação não tratado: ${interaction.id}`);
                        break;
                }
            }
            return [...schedulePatientsArray, ...serviceEvaluationArray];
        }
        catch (error) {
            console.error('Erro na DataSource:', error);
            throw error;
        }
        finally {
            try {
                await Database_1.default.manager.close('mssql');
            }
            catch (closeError) {
                console.warn('Erro ao fechar conexão MSSQL:', closeError);
            }
        }
    }
    async scheduledPatients(dateStr, unit = 0) {
        const date = luxon_1.DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'America/Sao_Paulo' });
        if (!date.isValid) {
            throw new Error('Formato de data inválido. Use yyyy-MM-dd');
        }
        const dateStart = date.startOf('day').toFormat('yyyy-MM-dd HH:mm');
        const dateEnd = date.endOf('day').toFormat('yyyy-MM-dd HH:mm');
        const greeting = async (message) => {
            const responseList = new ResponsesController_1.default();
            const greetings = await responseList.index({ local: 'greeting' });
            const presentations = await responseList.index({ local: 'presentation' });
            return message
                .replace('{greeting}', greetings)
                .replace('{presentation}', presentations);
        };
        const pacQueryModel = await Interaction_1.default.query().where('id', 1).first();
        if (!pacQueryModel) {
            throw new Error('Consulta para scheduledPatients não encontrada');
        }
        const env = process.env.NODE_ENV;
        const pacQuery = env === 'development' ? pacQueryModel.querydev : pacQueryModel.query;
        if (!pacQuery) {
            throw new Error('Query inválida para scheduledPatients');
        }
        try {
            let query = pacQuery
                .replace(/\{dateStart\}/g, dateStart)
                .replace(/\{dateEnd\}/g, dateEnd);
            if (unit > 0)
                query = query.replace('1=1', ` emp_cod=${unit}`);
            const result = await Database_1.default.connection('mssql')
                .rawQuery(query);
            for (const data of result) {
                if (data.message && typeof data.message === 'string') {
                    data.message = await greeting(data.message);
                }
            }
            return result;
        }
        catch (error) {
            console.error('Erro em scheduledPatients:', error);
            throw error;
        }
        finally {
            await Database_1.default.manager.close('mssql');
        }
    }
    async confirmSchedule(chat, chatOtherFields = "") {
        const dateNow = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        const dateSchedule = luxon_1.DateTime.fromFormat(chatOtherFields['schedule'], 'yyyy-MM-dd HH:mm');
        const startOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00", dateSchedule);
        const endOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59", dateSchedule);
        try {
            const query = await Database_1.default.connection('mssql')
                .from('agm')
                .where('agm_pac', chat.reg)
                .whereBetween('agm_hini', [startOfDay, endOfDay])
                .whereNotIn('agm_stat', ['C', 'B'])
                .whereNotIn('agm_confirm_stat', ['C'])
                .update({
                AGM_CONFIRM_STAT: 'C',
                AGM_CONFIRM_OBS: `CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
                AGM_CONFIRM_USR: process.env.SERVER_API_USER
            });
            await Database_1.default.manager.close('mssql');
            return query;
        }
        catch (error) {
            return error;
        }
    }
    async confirmScheduleAll() {
        console.log("Executando confirmações no Smart...");
        const dateNow = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        const startOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00", luxon_1.DateTime.local());
        const endOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59", luxon_1.DateTime.local());
        const returnChats = await Chat_1.default.query()
            .preload('shippingcampaign')
            .whereBetween('created_at', [startOfDay, endOfDay])
            .andWhere('externalstatus', 'A')
            .andWhere('absoluteresp', 1)
            .andWhere('interaction_id', 1);
        try {
            for (const chat of returnChats) {
                const momentDate = (0, moment_1.default)(chat.shippingcampaign.dateshedule);
                const dateStart = momentDate.format('YYYY-MM-DD 00:00:00');
                const dateEnd = momentDate.format('YYYY-MM-DD 23:59:00');
                const query = await Database_1.default.connection('mssql')
                    .from('agm')
                    .where('agm_pac', chat.reg)
                    .andWhereBetween('agm_hini', [dateStart, dateEnd])
                    .whereNotIn('agm_stat', ['C', 'B'])
                    .whereNotIn('agm_confirm_stat', ['C'])
                    .update({
                    AGM_CONFIRM_STAT: 'C',
                    AGM_CONFIRM_OBS: `DIGI3: CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
                    AGM_CONFIRM_USR: process.env.SERVER_API_USER
                });
                if (query > 0) {
                    await Chat_1.default.query().where('reg', chat.reg).andWhere('idexternal', chat.idexternal).update({ externalstatus: 'B' });
                }
            }
        }
        catch (error) {
            return error;
        }
    }
    async cancelScheduleAll() {
        console.log("Executando Cancelamentos no Smart...");
        const startOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00", luxon_1.DateTime.local());
        const endOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59", luxon_1.DateTime.local());
        const returnChats = await Chat_1.default.query()
            .preload('shippingcampaign')
            .whereBetween('created_at', [startOfDay, endOfDay])
            .andWhere('externalstatus', 'A')
            .andWhere('absoluteresp', 2)
            .andWhere('interaction_id', 1);
        try {
            for (const chat of returnChats) {
                const momentDate = (0, moment_1.default)(chat.shippingcampaign.dateshedule);
                const dateStart = momentDate.format('YYYY-MM-DD 00:00:00');
                const dateEnd = momentDate.format('YYYY-MM-DD 23:59:00');
                const query = await Database_1.default.connection('mssql')
                    .from('agm')
                    .where('agm_pac', chat.reg)
                    .andWhereBetween('agm_hini', [dateStart, dateEnd])
                    .whereNotIn('agm_stat', ['C', 'B'])
                    .whereNotIn('agm_confirm_stat', ['C']);
                for (const agm of query) {
                    const body = {
                        "PacienteId": agm.AGM_PAC,
                        "ProcedimentoId": agm.AGM_SMK,
                        "ProfissionalExecutanteId": agm.AGM_MED,
                        "DataHora": luxon_1.DateTime.fromJSDate(agm.AGM_HINI, { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm')
                    };
                    const response = await (0, request_1.cancelSchedule)(body);
                    if (response?.status == 200) {
                        console.log(`Cancelamento PacReg:${agm.AGM_PAC}, Procedimento:${agm.AGM_SMK} Data:${luxon_1.DateTime.fromJSDate(agm.AGM_HINI, { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm')}`);
                        await Chat_1.default.query().where('reg', chat.reg).andWhere('idexternal', chat.idexternal).update({ externalstatus: 'B' });
                    }
                }
            }
        }
        catch (error) {
            return error;
        }
    }
    async serviceEvaluation() {
        async function greeting(message) {
            const responseList = new ResponsesController_1.default();
            const greeting = await responseList.index({ local: 'greeting' });
            const question = ['em uma escala de *0 a 10*, o quanto você indicaria o nosso Núcleo de Excelência em Oftalmologia a um amigo ou parente?',
                'em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou membro da família?',
                'em uma escala de *0 a 10*, o quanto você indicaria o Núcleo de Excelência em Oftalmologia a alguém que você conhece?',
                'em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou familiar?',
            ];
            return message.replace('{greeting}', greeting).replace('{question}', question[Math.floor(Math.random() * question.length)]);
        }
        const pacQueryModel = await Interaction_1.default.find(2);
        const env = process.env.NODE_ENV;
        let pacQuery;
        if (env === 'development')
            pacQuery = pacQueryModel?.querydev;
        else
            pacQuery = pacQueryModel?.query;
        try {
            const result = await Database_1.default.connection('mssql').rawQuery(pacQuery);
            for (const data of result) {
                const message = await greeting(data.message);
                data.message = message;
            }
            await Database_1.default.manager.close('mssql');
            return result;
        }
        catch (error) {
            return { "ERRO": "ERRO 21221", error };
        }
    }
    async resetCellphone() {
        const date_start = luxon_1.DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm");
        const date_end = luxon_1.DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm");
        try {
            await Shippingcampaign_1.default.query()
                .where('phonevalid', 0)
                .whereBetween('created_at', [date_start, date_end])
                .update({ phonevalid: null });
        }
        catch (error) {
            return { "ERRO": "ERRO 21221", error };
        }
    }
}
exports.default = DatasourcesController;
//# sourceMappingURL=DatasourcesController.js.map