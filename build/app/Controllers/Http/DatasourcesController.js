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
    async DataSource(date, interaction_id = 0, unit_cod = 0) {
        interaction_id = Number(interaction_id) || 0;
        unit_cod = Number(unit_cod) || 0;
        try {
            let schedulePatientsArray = [];
            let serviceEvaluationArray = [];
            let generalMessagePatientArray = [];
            if (interaction_id === 1) {
                return await this.scheduledPatients(date, unit_cod);
            }
            if (interaction_id === 2) {
                return await this.serviceEvaluation();
            }
            if (interaction_id === 3) {
                return await this.generalMessagePatient(date, unit_cod);
            }
            const interactionList = await Interaction_1.default.query().where('status', 1);
            for (const interaction of interactionList) {
                switch (interaction.id) {
                    case 1:
                        schedulePatientsArray = await this.scheduledPatients(date, unit_cod);
                        break;
                    case 2:
                        serviceEvaluationArray = await this.serviceEvaluation();
                        break;
                    case 3:
                        generalMessagePatientArray = await this.generalMessagePatient(date, unit_cod);
                        console.log("Teste de envio amadurecimento do chip", interaction.name);
                        break;
                    default:
                        console.warn(`ID de interação não tratado: ${interaction.id}`);
                        break;
                }
            }
            return [...schedulePatientsArray, ...serviceEvaluationArray, ...generalMessagePatientArray];
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
    async scheduledPatients(dateStr, unit_cod = 0) {
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
        if (!pacQueryModel)
            throw new Error('Consulta para scheduledPatients não encontrada');
        const env = process.env.NODE_ENV;
        const pacQuery = env === 'development' ? pacQueryModel.querydev : pacQueryModel.query;
        if (!pacQuery)
            throw new Error('Query inválida para scheduledPatients');
        let query = pacQuery
            .replace(/\{dateStart\}/g, dateStart)
            .replace(/\{dateEnd\}/g, dateEnd);
        if (unit_cod > 0) {
            query = query.replace('1=1', `emp_cod=${unit_cod}`);
        }
        try {
            const result = await Database_1.default.connection('mssql').rawQuery(query);
            for (const data of result) {
                if (data.message && typeof data.message === 'string') {
                    data.message = await greeting(data.message);
                }
            }
            return result || [];
        }
        catch (error) {
            console.error('Erro em scheduledPatients:', error);
            return [];
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
            return result || [];
        }
        catch (error) {
            console.error('Erro na serviceEvaluation:', error);
            return [];
        }
    }
    async generalMessagePatient(dateStr, unit_cod = 0) {
        console.log("passei no 777788888***");
        const date = luxon_1.DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'America/Sao_Paulo' });
        if (!date.isValid) {
            throw new Error('Formato de data inválido. Use yyyy-MM-dd');
        }
        const dateStart = date.startOf('day').toFormat('yyyy-MM-dd HH:mm');
        const dateEnd = date.endOf('day').toFormat('yyyy-MM-dd HH:mm');
        console.log("DATE START:", dateStart, "DATE END:", dateEnd);
        const greeting = async (message) => {
            const responseList = new ResponsesController_1.default();
            const greetings = await responseList.index({ local: 'greeting' });
            const presentations = await responseList.index({ local: 'presentation' });
            return message
                .replace('{greeting}', greetings)
                .replace('{presentation}', presentations);
        };
        const interaction = await Interaction_1.default.query().where('id', 3).andWhere('status', 1);
        const pacQueryModels = Array.isArray(interaction) ? interaction : [interaction];
        if (!pacQueryModels || pacQueryModels.length === 0) {
            throw new Error('Consulta para scheduledPatients não encontrada');
        }
        const env = process.env.NODE_ENV;
        const allResults = [];
        for (const pacQueryModel of pacQueryModels) {
            const pacQuery = env === 'development' ? pacQueryModel.querydev : pacQueryModel.query;
            if (!pacQuery)
                continue;
            let query = pacQuery
                .replace(/\{dateStart\}/g, dateStart)
                .replace(/\{dateEnd\}/g, dateEnd);
            if (unit_cod > 0) {
                query = query.replace('1=1', `emp_cod=${unit_cod}`);
            }
            try {
                const result = await Database_1.default.connection('mssql').rawQuery(query);
                for (const data of result) {
                    if (data.message && typeof data.message === 'string') {
                        data.message = await greeting(data.message);
                    }
                }
                allResults.push(...result);
            }
            catch (error) {
                console.error('Erro ao executar query de scheduledPatients:', error);
                continue;
            }
        }
        return allResults;
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
    async patientsByProcedures({ auth, request, response }) {
        await auth.use('api').authenticate();
        const startDate = request.input('start_date');
        const endDate = request.input('end_date');
        const query = Database_1.default.connection('mssql')
            .from('OSM')
            .innerJoin('SMM', (join) => {
            join.on('OSM.OSM_SERIE', '=', 'SMM.SMM_OSM_SERIE')
                .on('OSM.OSM_NUM', '=', 'SMM.SMM_OSM');
        })
            .innerJoin('SMK', 'SMM.SMM_COD', 'SMK.SMK_COD')
            .leftJoin('PSV', 'SMM.SMM_MED', 'PSV.PSV_CRM')
            .leftJoin('PSV as PSV_REQ', 'OSM.OSM_MREQ', 'PSV_REQ.PSV_CRM')
            .innerJoin('PAC', 'PAC.PAC_REG', 'OSM.OSM_PAC')
            .innerJoin('CNV', 'OSM.OSM_CNV', 'CNV.CNV_COD')
            .innerJoin('STR', 'OSM.OSM_STR', 'STR.STR_COD')
            .whereBetween('OSM.OSM_DTHR', [startDate, endDate])
            .select('OSM.OSM_SERIE', 'OSM.OSM_NUM', 'OSM.OSM_PAC', 'OSM.OSM_DTHR', 'OSM.OSM_CNV', 'CNV.CNV_NOME', 'OSM.OSM_PROC', 'OSM.OSM_MREQ', 'OSM.OSM_STR', 'STR.STR_NOME', 'OSM.OSM_STATUS', 'OSM.OSM_IND_URG', 'OSM.OSM_HSP_NUM', 'OSM.OSM_TIPO', 'OSM.OSM_DT_RESULT', 'OSM.OSM_ATEND', 'OSM.OSM_CID_COD', 'OSM.OSM_OBS', 'OSM.OSM_MCNV', 'OSM.OSM_PADRAO_PRECO', 'OSM.OSM_DT_SOLIC', 'OSM.OSM_HORA_ESP', 'OSM.OSM_LIB_PAG', 'OSM.OSM_LIB_PAG_DTHR', 'OSM.OSM_LIB_PAG_USR', 'OSM.OSM_MTE_SERIE_BENEF', 'OSM.OSM_MTE_SEQ_BENEF', 'OSM.OSM_OSM_SERIE_BENEF', 'OSM.OSM_OSM_NUM_BENEF', 'OSM.OSM_LIB_PAG_SERIE', 'OSM.OSM_LIB_PAG_NUM', 'OSM.OSM_ASO_MES_REF', 'OSM.OSM_NUM_EXTERNO', 'OSM.OSM_CML_CNV_COD', Database_1.default.raw('LTRIM(RTRIM(PSV_REQ.PSV_NOME)) AS OSM_MREQ_NOME'), 'PAC.PAC_REG', 'PAC.PAC_DREG', 'PAC.PAC_PRONT', 'PAC.PAC_NOME', 'PAC.pac_nome_social', 'PAC.pac_flag_social', 'PAC.pac_dthr_social', 'PAC.PAC_SEXO', 'PAC.PAC_NASC', 'PAC.PAC_EST_CIVIL', 'PAC.PAC_NOME_MAE', 'PAC.PAC_NUMCPF', 'PAC.PAC_NUMRG', 'PAC.PAC_NUMRG_ORG', 'PAC.PAC_NUMRG_UF', 'PAC.PAC_NUMRG_DTEXP', 'PAC.PAC_EMAIL', 'PAC.PAC_FONE', 'PAC.PAC_FONE2', 'PAC.PAC_CELULAR', 'PAC.PAC_RAMAL', 'PAC.pac_ind_whatsapp', 'PAC.PAC_END', 'PAC.PAC_END_NUM', 'PAC.PAC_COMP', 'PAC.PAC_COMP_EXTRA', 'PAC.PAC_CEP', 'PAC.PAC_CID', 'PAC.PAC_UF', 'PAC.PAC_ZONA', 'PAC.PAC_LGR_COD', 'PAC.PAC_CARTAO_SUS', 'PAC.PAC_SUS_SISCEL', 'PAC.PAC_CNV', 'PAC.PAC_MCNV', 'PAC.PAC_CNV_COD', 'PAC.PAC_PLN_COD', 'PAC.PAC_COD_DEPCNV', 'PAC.PAC_DTCNV_PAG', 'PAC.PAC_DTCNV_VAL', 'PAC.PAC_CNV2', 'PAC.PAC_MCNV2', 'PAC.PAC_CNV2_COD', 'PAC.PAC_PLN2_COD', 'PAC.PAC_COD_DEPCNV2', 'PAC.PAC_PESO', 'PAC.pac_peso_unid', 'PAC.PAC_ALT', 'PAC.pac_alt_unid', 'PAC.PAC_ABORH', 'SMM.SMM_OSM_SERIE', 'SMM.SMM_OSM', 'SMM.SMM_NUM', 'SMM.SMM_TPCOD', 'SMM.SMM_COD', 'SMM.SMM_QT', 'SMM.SMM_EXEC', 'SMM.SMM_SFAT', 'SMM.SMM_FAT_SERIE', 'SMM.SMM_FAT', 'SMM.SMM_REP', 'SMM.SMM_STR', 'SMM.SMM_MED', 'SMM.SMM_VLR', 'SMM.SMM_DTHR_EXEC', 'SMM.SMM_PAC_REG', 'SMM.SMM_CNV_COD', Database_1.default.raw('LTRIM(RTRIM(SMK.SMK_NOME)) AS SMM_SMK_NOME'), Database_1.default.raw('LTRIM(RTRIM(PSV.PSV_NOME)) AS SMM_MED_NOME'))
            .orderBy('OSM.OSM_SERIE')
            .orderBy('OSM.OSM_NUM')
            .orderBy('OSM.OSM_PAC')
            .orderBy('SMM.SMM_NUM');
        const rows = await query;
        const groups = new Map();
        for (const row of rows) {
            const pac = {};
            const smm = {};
            const osm = {};
            for (const [key, value] of Object.entries(row)) {
                if (key.startsWith('PAC_') || key.startsWith('pac_'))
                    pac[key] = value;
                else if (key.startsWith('SMM_'))
                    smm[key] = value;
                else
                    osm[key] = value;
            }
            const gkey = `${osm.OSM_SERIE}|${osm.OSM_NUM}|${osm.OSM_PAC}`;
            if (!groups.has(gkey))
                groups.set(gkey, { ...osm, pac, smms: [] });
            groups.get(gkey).smms.push(smm);
        }
        const result = Array.from(groups.values()).map(i => {
            if (i._seen)
                delete i._seen;
            return i;
        });
        return response.send(result);
    }
    async patientsBySchedules({ auth, request, response }) {
        await auth.use('api').authenticate();
        const startDate = request.input('start_date');
        const endDate = request.input('end_date');
        const query = Database_1.default.connection('mssql')
            .from('AGM')
            .innerJoin('PAC', 'PAC.PAC_REG', 'AGM.AGM_PAC')
            .leftJoin('PSV', 'AGM.AGM_MED', 'PSV.PSV_CRM')
            .leftJoin('LOC', 'AGM.AGM_LOC', 'LOC.LOC_COD')
            .leftJoin('SMK', 'AGM.AGM_SMK', 'SMK.SMK_COD')
            .select('AGM.AGM_MED', 'AGM.AGM_LOC', 'AGM.AGM_SMK', 'AGM.AGM_HINI', 'AGM.AGM_HFIM', 'AGM.AGM_PAC', 'AGM.AGM_TPSMK', 'AGM.agm_smk', 'AGM.AGM_REC', 'AGM.AGM_STAT', 'AGM.AGM_CTF', 'AGM.AGM_DTMRC', 'AGM.AGM_ATEND', 'AGM.AGM_STR_COD', 'AGM.AGM_CONFIRM_STAT', 'AGM.AGM_CONFIRM_USR', 'AGM.AGM_CONFIRM_DTHR', 'AGM.AGM_CNV_COD', Database_1.default.raw('LTRIM(RTRIM(PSV.PSV_NOME)) AS AGM_MED_NOME'), Database_1.default.raw('LTRIM(RTRIM(LOC.LOC_NOME)) AS AGM_LOC_NOME'), Database_1.default.raw('LTRIM(RTRIM(SMK.SMK_NOME)) AS AGM_SMK_NOME'), 'PAC.PAC_REG', 'PAC.PAC_DREG', 'PAC.PAC_PRONT', 'PAC.PAC_NOME', 'PAC.pac_nome_social', 'PAC.pac_flag_social', 'PAC.pac_dthr_social', 'PAC.PAC_SEXO', 'PAC.PAC_NASC', 'PAC.PAC_EST_CIVIL', 'PAC.PAC_NOME_MAE', 'PAC.PAC_NUMCPF', 'PAC.PAC_NUMRG', 'PAC.PAC_NUMRG_ORG', 'PAC.PAC_NUMRG_UF', 'PAC.PAC_NUMRG_DTEXP', 'PAC.PAC_EMAIL', 'PAC.PAC_FONE', 'PAC.PAC_FONE2', 'PAC.PAC_CELULAR', 'PAC.PAC_RAMAL', 'PAC.pac_ind_whatsapp', 'PAC.PAC_END', 'PAC.PAC_END_NUM', 'PAC.PAC_COMP', 'PAC.PAC_COMP_EXTRA', 'PAC.PAC_CEP', 'PAC.PAC_CID', 'PAC.PAC_UF', 'PAC.PAC_ZONA', 'PAC.PAC_LGR_COD', 'PAC.PAC_CARTAO_SUS', 'PAC.PAC_SUS_SISCEL', 'PAC.PAC_CNV', 'PAC.PAC_MCNV', 'PAC.PAC_CNV_COD', 'PAC.PAC_PLN_COD', 'PAC.PAC_COD_DEPCNV', 'PAC.PAC_DTCNV_PAG', 'PAC.PAC_DTCNV_VAL', 'PAC.PAC_CNV2', 'PAC.PAC_MCNV2', 'PAC.PAC_CNV2_COD', 'PAC.PAC_PLN2_COD', 'PAC.PAC_COD_DEPCNV2', 'PAC.PAC_PESO', 'PAC.pac_peso_unid', 'PAC.PAC_ALT', 'PAC.pac_alt_unid', 'PAC.PAC_ABORH');
        if (startDate && endDate) {
            query.whereBetween('AGM.AGM_HINI', [
                `${startDate} 00:00:00`,
                `${endDate} 23:59:59`,
            ]);
        }
        else if (startDate) {
            query.where('AGM.AGM_HINI', '>=', `${startDate} 00:00:00`);
        }
        else if (endDate) {
            query.where('AGM.AGM_HINI', '<=', `${endDate} 23:59:59`);
        }
        const rows = await query.orderBy('AGM.AGM_HINI', 'asc');
        const result = rows.map((row) => {
            const agm = {};
            const pac = {};
            for (const [key, value] of Object.entries(row)) {
                if (key.startsWith('PAC_') || key.startsWith('pac_'))
                    pac[key] = value;
                else
                    agm[key] = value;
            }
            return { agm: { ...agm, pac } };
        });
        return response.send(result);
    }
    async medicosPorConvenio({ auth, params, response }) {
        const pacReg = String(params.paciente_id || '').trim();
        if (!pacReg) {
            return response.badRequest({
                erro: 'paciente_nao_encontrado',
                mensagem: 'Nenhum registro de paciente encontrado para o paciente_id informado.'
            });
        }
        const medicosPermitidos = [
            21725,
            19744,
            32782,
            32768,
            27684,
            28909,
            44616,
            24701,
            51257,
            23648,
            33072,
        ];
        const pacienteResult = await Database_1.default.connection('mssql').rawQuery(`
    SELECT
      P.PAC_REG,
      P.PAC_NOME,
      P.PAC_NASC,
      P.PAC_FONE,
      P.PAC_CNV,
      C.CNV_COD AS convenio_id,
      C.CNV_NOME AS convenio_descricao,
      CASE
        WHEN P.PAC_NASC IS NULL THEN NULL
        WHEN DATEDIFF(YEAR, P.PAC_NASC, GETDATE()) < 18 THEN 'infantil'
        ELSE 'adulto'
      END AS faixa_etaria
    FROM dbo.PAC P
    LEFT JOIN dbo.CNV C
      ON C.CNV_COD = P.PAC_CNV
    WHERE P.PAC_REG = ?
    `, [pacReg]);
        const pacienteRows = this.getRows(pacienteResult);
        console.log(pacienteRows);
        if (!pacienteRows.length) {
            return response.notFound({
                erro: 'paciente_nao_encontrado',
                mensagem: 'Nenhum registro de paciente encontrado para o paciente_id informado.'
            });
        }
        const paciente = pacienteRows[0];
        if (!paciente.PAC_NASC) {
            return response.badRequest({
                erro: 'data_nascimento_ausente',
                mensagem: 'O registro do paciente nao possui data de nascimento valida. A filtragem por faixa etaria nao pode ser aplicada.'
            });
        }
        const pacienteId = String(paciente.PAC_REG).trim();
        const faixaEtaria = this.trimValue(paciente.faixa_etaria);
        const convenioId = this.trimValue(paciente.convenio_id);
        const convenioDescricao = this.trimValue(paciente.convenio_descricao);
        if (!convenioId) {
            return response.ok({
                paciente_id: pacienteId,
                faixa_etaria: faixaEtaria,
                convenio_id: null,
                convenio_descricao: null,
                medicos: [],
            });
        }
        const placeholdersMedicos = medicosPermitidos.map(() => '?').join(', ');
        const filtroContratoInfantil = faixaEtaria === 'infantil'
            ? ` AND CAT.CAT_CONTRATO = 'INFANTIL' `
            : '';
        const medicosResult = await Database_1.default.connection('mssql').rawQuery(`
    SELECT
      CAT.CAT_CNV_COD,
      CAT.CAT_CONTRATO,
      PSV.PSV_COD,
      PSV.PSV_NOME,
      PSV.PSV_CONSELHO,
      PSV.PSV_CRM,
      PSV.PSV_UF,
      ESM.ESM_ESP,
      ESP.ESP_NOME
    FROM CAT
    INNER JOIN PSV
      ON CAT.CAT_PSV_COD = PSV.PSV_COD
    INNER JOIN ESM
      ON PSV.PSV_COD = ESM.ESM_MED
    INNER JOIN ESP
      ON ESM.ESM_ESP = ESP.ESP_COD
    WHERE CAT.CAT_CNV_COD = ?
      ${filtroContratoInfantil}
      AND CAT.CAT_PSV_COD IN (${placeholdersMedicos})
    ORDER BY PSV.PSV_NOME, ESP.ESP_NOME
    `, [convenioId, ...medicosPermitidos]);
        const medicosRows = this.getRows(medicosResult);
        const medicosMap = new Map();
        for (const row of medicosRows) {
            const medicoId = String(row.PSV_COD).trim();
            if (!medicosMap.has(medicoId)) {
                medicosMap.set(medicoId, {
                    medico_id: medicoId,
                    nome: this.trimValue(row.PSV_NOME),
                    especialidades: [],
                    conselho_tipo: this.trimValue(row.PSV_CONSELHO),
                    conselho_numero: row.PSV_CRM ? String(row.PSV_CRM).trim() : null,
                    conselho_uf: this.trimValue(row.PSV_UF),
                });
            }
            const medico = medicosMap.get(medicoId);
            const especialidade = this.trimValue(row.ESP_NOME);
            if (especialidade &&
                !medico.especialidades.includes(especialidade)) {
                medico.especialidades.push(especialidade);
            }
        }
        return response.ok({
            paciente_id: pacienteId,
            faixa_etaria: faixaEtaria,
            convenio_id: convenioId,
            convenio_descricao: convenioDescricao,
            medicos: Array.from(medicosMap.values()),
        });
    }
    async medicosPorConvenioHorario({ auth, params, response }) {
        const pacReg = String(params.paciente_id || '').trim();
        const profissionalExecutanteId = String(params.profissional_executante_id || '').trim();
        if (!pacReg) {
            return response.badRequest({
                erro: 'paciente_nao_encontrado',
                mensagem: 'Nenhum registro de paciente encontrado para o paciente_id informado.'
            });
        }
        const medicosPermitidos = [
            21725,
            19744,
            32782,
            32768,
            27684,
            28909,
            44616,
            24701,
            51257,
            23648,
            33072,
        ];
        const pacienteResult = await Database_1.default.connection('mssql').rawQuery(`
    SELECT
      P.PAC_REG,
      P.PAC_NOME,
      P.PAC_NASC,
      P.PAC_FONE,
      P.PAC_CNV,
      C.CNV_COD AS convenio_id,
      C.CNV_NOME AS convenio_descricao,
      CASE
        WHEN P.PAC_NASC IS NULL THEN NULL
        WHEN DATEDIFF(YEAR, P.PAC_NASC, GETDATE()) < 18 THEN 'infantil'
        ELSE 'adulto'
      END AS faixa_etaria
    FROM dbo.PAC P
    LEFT JOIN dbo.CNV C
      ON C.CNV_COD = P.PAC_CNV
    WHERE P.PAC_REG = ?
    `, [pacReg]);
        const pacienteRows = this.getRows(pacienteResult);
        if (!pacienteRows.length) {
            return response.notFound({
                erro: 'paciente_nao_encontrado',
                mensagem: 'Nenhum registro de paciente encontrado para o paciente_id informado.'
            });
        }
        const paciente = pacienteRows[0];
        if (!paciente.PAC_NASC) {
            return response.badRequest({
                erro: 'data_nascimento_ausente',
                mensagem: 'O registro do paciente nao possui data de nascimento valida. A filtragem por faixa etaria nao pode ser aplicada.'
            });
        }
        const pacienteId = String(paciente.PAC_REG).trim();
        const faixaEtaria = this.trimValue(paciente.faixa_etaria);
        const convenioId = this.trimValue(paciente.convenio_id);
        const convenioDescricao = this.trimValue(paciente.convenio_descricao);
        if (!convenioId) {
            return response.ok({
                paciente_id: pacienteId,
                faixa_etaria: faixaEtaria,
                convenio_id: null,
                convenio_descricao: null,
                medicos: [],
            });
        }
        const dataIni = luxon_1.DateTime.local().toUTC().toISO({ suppressMilliseconds: true });
        const dataFim = luxon_1.DateTime.local().plus({ days: 10 }).toUTC().toISO({ suppressMilliseconds: true });
        const procedimentoAgenda = {
            ProcedimentoId: '00010014',
            ConvenioId: convenioId,
            UnidadeId: '14',
        };
        if (profissionalExecutanteId) {
            procedimentoAgenda.ProfissionalExecutanteId = profissionalExecutanteId;
        }
        const agendaBody = {
            DataIni: dataIni,
            DataFim: dataFim,
            Especialidade: 'OFT',
            ListaProcedimento: [procedimentoAgenda],
        };
        const placeholdersMedicos = medicosPermitidos.map(() => '?').join(', ');
        const filtroContratoInfantil = faixaEtaria === 'infantil'
            ? ` AND CAT.CAT_CONTRATO = 'INFANTIL' `
            : '';
        const medicosResult = await Database_1.default.connection('mssql').rawQuery(`
    SELECT
      CAT.CAT_CNV_COD,
      CAT.CAT_CONTRATO,
      PSV.PSV_COD,
      PSV.PSV_NOME,
      PSV.PSV_CONSELHO,
      PSV.PSV_CRM,
      PSV.PSV_UF,
      ESM.ESM_ESP,
      ESP.ESP_NOME
    FROM CAT
    INNER JOIN PSV
      ON CAT.CAT_PSV_COD = PSV.PSV_COD
    INNER JOIN ESM
      ON PSV.PSV_COD = ESM.ESM_MED
    INNER JOIN ESP
      ON ESM.ESM_ESP = ESP.ESP_COD
    WHERE CAT.CAT_CNV_COD = ?
      ${filtroContratoInfantil}
      AND CAT.CAT_PSV_COD IN (${placeholdersMedicos})
    ORDER BY PSV.PSV_NOME, ESP.ESP_NOME
    `, [convenioId, ...medicosPermitidos]);
        const medicosRows = this.getRows(medicosResult);
        const medicosMap = new Map();
        for (const row of medicosRows) {
            const medicoId = String(row.PSV_COD).trim();
            if (!medicosMap.has(medicoId)) {
                medicosMap.set(medicoId, {
                    medico_id: medicoId,
                    nome: this.trimValue(row.PSV_NOME),
                    especialidades: [],
                    conselho_tipo: this.trimValue(row.PSV_CONSELHO),
                    conselho_numero: row.PSV_CRM ? String(row.PSV_CRM).trim() : null,
                    conselho_uf: this.trimValue(row.PSV_UF),
                });
            }
            const medico = medicosMap.get(medicoId);
            const especialidade = this.trimValue(row.ESP_NOME);
            if (especialidade &&
                !medico.especialidades.includes(especialidade)) {
                medico.especialidades.push(especialidade);
            }
        }
        const agendaUrl = `${process.env.SERVER_URL_API_NEO}/Agenda`;
        console.log("SERVER>>>>>>>>>>>>>", agendaUrl);
        console.log('AGENDA REQUEST', {
            url: agendaUrl,
            body: agendaBody,
        });
        const agendaResponse = await (0, request_1.agendaResponse)(agendaBody);
        console.log('AGENDA RESPONSE', {
            status: agendaResponse.status,
            totalItens: Array.isArray(agendaResponse.data) ? agendaResponse.data.length : null,
            data: agendaResponse.data,
        });
        return response.ok({
            paciente_id: pacienteId,
            faixa_etaria: faixaEtaria,
            convenio_id: convenioId,
            convenio_descricao: convenioDescricao,
            medicos: Array.from(medicosMap.values()),
            horarios: agendaResponse.data,
        });
    }
    getRows(result) {
        if (!result) {
            return [];
        }
        if (Array.isArray(result)) {
            return result;
        }
        if (result?.recordset && Array.isArray(result.recordset)) {
            return result.recordset;
        }
        if (result?.recordsets &&
            Array.isArray(result.recordsets) &&
            result.recordsets.length) {
            return result.recordsets[0];
        }
        if (result?.rows && Array.isArray(result.rows)) {
            return result.rows;
        }
        return [];
    }
    trimValue(value) {
        if (typeof value === 'string') {
            return value.trim();
        }
        return value;
    }
}
exports.default = DatasourcesController;
//# sourceMappingURL=DatasourcesController.js.map