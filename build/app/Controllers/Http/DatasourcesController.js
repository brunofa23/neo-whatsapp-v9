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
const util_1 = require("../../Services/whatsapp-web/util");
class DatasourcesController {
    async DataSource() {
        const interactionList = await Interaction_1.default.query().where('status', '=', 1);
        let schedulePatientsArray = [];
        let serviceEvaluationArray = [];
        try {
            for (const interaction of interactionList) {
                if (interaction.id == 1) {
                    await Database_1.default.manager.close('mssql');
                    schedulePatientsArray = await this.scheduledPatients();
                }
                else if (interaction.id == 2) {
                    await Database_1.default.manager.close('mssql');
                    serviceEvaluationArray = await this.serviceEvaluation();
                }
                if (interaction.id == 3) {
                    console.log("Teste de envio amadurecimento do chip", interaction.name);
                }
            }
            const data = [...schedulePatientsArray, ...serviceEvaluationArray];
            return data;
        }
        catch (error) {
            return;
        }
    }
    async scheduledPatients() {
        async function greeting(message) {
            const greeting = ['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀'];
            const presentation = ['Eu me chamo Iris', 'Eu sou a Iris', 'Aqui é a Iris'];
            return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{presentation}', presentation[Math.floor(Math.random() * presentation.length)]);
        }
        const pacQueryModel = await Interaction_1.default.find(1);
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
            return { "ERRO": "ERRO 154212", error };
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
                AGM_CONFIRM_OBS: `NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
                AGM_CONFIRM_USR: 'NEOCONFIRM'
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
                    AGM_CONFIRM_OBS: `NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
                    AGM_CONFIRM_USR: 'NEOCONFIRM'
                });
                if (query > 0) {
                    console.log("update realizado sucesso");
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
        const dateNow = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
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
                    .whereNotIn('agm_confirm_stat', ['C'])
                    .update({
                    AGM_CONFIRM_STAT: 'N',
                    AGM_CONFIRM_OBS: chat.invalidresponse + ` (Desmarcado por NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow})`,
                    AGM_CONFIRM_USR: 'NEOCONFIRM',
                    AGM_CONFIRM_MOC: 'IRI'
                });
                if (query > 0) {
                    console.log("cancelamento realizado sucesso");
                    await Chat_1.default.query().where('reg', chat.reg).andWhere('idexternal', chat.idexternal).update({ externalstatus: 'B' });
                }
                console.log(query);
            }
        }
        catch (error) {
            return error;
        }
    }
    async cancelSchedule(chat, chatOtherFields = "") {
        const dateNow = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        const dateSchedule = luxon_1.DateTime.fromFormat(chatOtherFields['schedule'], 'yyyy-MM-dd HH:mm');
        const startOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00", dateSchedule);
        const endOfDay = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59", dateSchedule);
        let _invalidResponse = "";
        if (await (0, util_1.InvalidResponse)(chat.invalidresponse) == false) {
            _invalidResponse = chat.invalidresponse;
        }
        try {
            const query = await Database_1.default.connection('mssql')
                .from('agm')
                .where('agm_pac', chat.reg)
                .whereBetween('agm_hini', [startOfDay, endOfDay])
                .whereNotIn('agm_stat', ['C', 'B'])
                .whereNotIn('agm_confirm_stat', ['C'])
                .update({
                AGM_CONFIRM_STAT: 'N',
                AGM_CONFIRM_USR: 'NEOCONFIRM',
                AGM_CONFIRM_OBS: _invalidResponse + ` (Desmarcado por NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow})`,
                AGM_CONFIRM_DTHR: dateNow,
                AGM_CONFIRM_MOC: 'IRI'
            });
            await Database_1.default.manager.close('mssql');
            return query;
        }
        catch (error) {
            return error;
        }
    }
    async serviceEvaluation() {
        async function greeting(message) {
            const greeting = ['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀'];
            const question = ['Gostaríamos de avaliar a sua experiência recente em nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você indicaria o nosso Núcleo de Excelência em Oftalmologia a um amigo ou parente?',
                'Queremos saber mais sobre a sua consulta mais recente ao nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou membro da família?',
                'Estamos interessados em ouvir sua opinião sobre sua experiência mais recente em nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você indicaria o Núcleo de Excelência em Oftalmologia a alguém que você conhece?',
                'Queremos entender melhor sua experiência recente em nosso hospital Neo. Em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou familiar?',
            ];
            return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{question}', question[Math.floor(Math.random() * question.length)]);
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
}
exports.default = DatasourcesController;
//# sourceMappingURL=DatasourcesController.js.map