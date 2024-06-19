"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const util_1 = require("../../Services/whatsapp-web/util");
const luxon_1 = require("luxon");
class ShippingcampaignsController {
    static get connection() {
        return 'mysql';
    }
    async index({ auth, response }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default.all();
            return response.status(200).send(shippingCampaign);
        }
        catch (error) {
            return error;
        }
    }
    async store({ auth, request, response }) {
        const body = request.only(Shippingcampaign_1.default.fillable);
        response.send(body);
        const data = await Shippingcampaign_1.default.create(body);
        return response.status(201).send(data);
    }
    async show({ auth, params, response }) {
        try {
            const payLoad = await Shippingcampaign_1.default.find(params.id);
            return response.status(200).send(payLoad);
        }
        catch (error) {
            return error;
        }
    }
    async update({ auth, request, params, response }) {
        const body = request.only(Shippingcampaign_1.default.fillable);
        body.id = params.id;
        try {
            const data = await Shippingcampaign_1.default.query().where('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async messagesSent() {
        try {
            const maxLimitSendMessage = await Shippingcampaign_1.default.query()
                .where('messagesent', '=', '1');
            return maxLimitSendMessage;
        }
        catch (error) {
            return error;
        }
    }
    async resend({ auth, params, response }) {
        const data = await Shippingcampaign_1.default.query().where('id', params.id).update({ 'excluded': true });
        const message = await Shippingcampaign_1.default.find(params.id);
        if (message) {
            const newData = await Shippingcampaign_1.default.create({
                attendant: message?.attendant,
                cellphone: message?.cellphone,
                cellphoneserialized: message.cellphoneserialized,
                doctor: message?.doctor,
                idexternal: message?.idexternal,
                interaction_id: message?.interaction_id,
                interaction_seq: message?.interaction_seq,
                message: message?.message,
                messagesent: false,
                name: message?.name,
                otherfields: message?.otherfields,
                prioritysend: true,
                reg: message?.reg,
                dateservice: message?.dateservice,
                unit: message?.unit
            });
            return response.status(201).send(newData);
        }
    }
    async doctorList({ response }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default.query()
                .distinct('doctor')
                .orderBy('doctor', 'asc');
            return response.status(200).send(shippingCampaign);
        }
        catch (error) {
            return error;
        }
    }
    async unitList({ response }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default.query()
                .distinct('unit')
                .orderBy('unit', 'asc');
            return response.status(200).send(shippingCampaign);
        }
        catch (error) {
            return error;
        }
    }
    async attendantList({ response }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default.query()
                .distinct('attendant')
                .orderBy('attendant', 'asc');
            return response.status(200).send(shippingCampaign);
        }
        catch (error) {
            return error;
        }
    }
    async maxLimitSendMessage(agent) {
        const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
        const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
        const chatName = agent.name;
        const countMessage = await Chat_1.default.query()
            .countDistinct('shippingcampaigns_id as tot')
            .where('chatname', chatName)
            .whereBetween('created_at', [dateStart, dateEnd]).first();
        if (!countMessage || countMessage == undefined || countMessage == null)
            return 0;
        return parseInt(countMessage.$extras.tot);
    }
    async chat() {
        const id = 567508;
        const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}`;
        try {
            await Database_1.default.connection('mssql').rawQuery(query).then((result) => {
                return `executado com sucesso:: ${result}`;
            }).catch((error) => {
                return `Error: ${error}`;
            });
        }
        catch (error) {
            return error;
        }
    }
    async dayPosition(period = "") {
        const startDate = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
        const endDate = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
        const totalDiario = await Shippingcampaign_1.default.query()
            .whereBetween('created_at', [startDate, endDate])
            .count('* as totalDiario').first();
        const telefonesValidos = await Shippingcampaign_1.default.query()
            .where('phonevalid', 1)
            .whereBetween('created_at', [startDate, endDate])
            .count('* as telefonesValidos').first();
        const mensagensEnviadas = await Shippingcampaign_1.default.query()
            .where('messagesent', 1)
            .whereBetween('created_at', [startDate, endDate])
            .count('* as mensagensEnviadas').first();
        const mensagensRetornadas = await Chat_1.default.query()
            .where('returned', 1)
            .whereBetween('created_at', [startDate, endDate])
            .count('* as mensagensRetornadas').first();
        const confirmacoes = await Chat_1.default.query()
            .where('absoluteresp', 1)
            .whereBetween('created_at', [startDate, endDate])
            .count('* as confirmacoes').first();
        const reagendamentos = await Chat_1.default.query()
            .where('absoluteresp', 2)
            .whereBetween('created_at', [startDate, endDate])
            .count('* as reagendamentos').first();
        const result = {
            totalDiario: totalDiario.$extras.totalDiario,
            telefonesValidos: telefonesValidos.$extras.telefonesValidos,
            mensagensEnviadas: mensagensEnviadas.$extras.mensagensEnviadas,
            mensagensRetornadas: mensagensRetornadas.$extras.mensagensRetornadas,
            confirmacoes: confirmacoes.$extras.confirmacoes,
            reagendamentos: reagendamentos.$extras.reagendamentos
        };
        return result;
    }
    async datePosition({ request, response }) {
        const { initialdate, finaldate } = request.only(['initialdate', 'finaldate']);
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection(Env_1.default.get('DB_CONNECTION_MAIN')).query()
                .select(Database_1.default.raw('CONVERT(date, shippingcampaigns.created_at) as dataPeriodo'))
                .select(Database_1.default.raw('COUNT(*) as totalDiario'))
                .select(Database_1.default.raw('SUM(CASE WHEN phonevalid = 1 THEN 1 ELSE 0 END) as telefonesValidos'))
                .select(Database_1.default.raw('SUM(CASE WHEN messagesent = 1 THEN 1 ELSE 0 END) as mensagensEnviadas'))
                .select(Database_1.default.raw('SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) AS mensagensRetornadas'))
                .select(Database_1.default.raw('SUM(CASE WHEN absoluteresp = 1 THEN 1 ELSE 0 END) AS confirmacoes'))
                .select(Database_1.default.raw('SUM(CASE WHEN absoluteresp = 2 THEN 1 ELSE 0 END) AS reagendamentos'))
                .from('shippingcampaigns')
                .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
                .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])
                .groupByRaw('CONVERT(date, shippingcampaigns.created_at)')
                .orderByRaw(Database_1.default.raw('CONVERT(date, shippingcampaigns.created_at)')).toQuery();
            return response.status(201).send(result);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async datePositionSynthetic({ request, response }) {
        const { initialdate, finaldate } = request.only(['initialdate', 'finaldate']);
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection('mssql2').query()
                .select(Database_1.default.raw('COUNT(*) as totalDiario'))
                .select(Database_1.default.raw('SUM(CASE WHEN phonevalid = 1 THEN 1 ELSE 0 END) as telefonesValidos'))
                .select(Database_1.default.raw('SUM(CASE WHEN messagesent = 1 THEN 1 ELSE 0 END) as mensagensEnviadas'))
                .select(Database_1.default.raw('SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) AS mensagensRetornadas'))
                .select(Database_1.default.raw('SUM(CASE WHEN absoluteresp = 1 THEN 1 ELSE 0 END) AS confirmacoes'))
                .select(Database_1.default.raw('SUM(CASE WHEN absoluteresp = 2 THEN 1 ELSE 0 END) AS reagendamentos'))
                .from('shippingcampaigns')
                .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
                .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate]);
            return response.status(201).send(result);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async listShippingCampaigns({ request, response }) {
        const { initialdate, finaldate, phonevalid, invalidresponse, absoluteresp } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp']);
        let query = "1=1";
        if (phonevalid && phonevalid !== undefined) {
            query += ` and phonevalid=${phonevalid == 1 ? 1 : 0}`;
        }
        if (invalidresponse) {
            query += ` and invalidresponse not in ('1', '2', 'Sim', 'Não')`;
        }
        if (absoluteresp) {
            query += ` and absoluteresp=${absoluteresp} `;
        }
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection('mssql2').query()
                .from('shippingcampaigns')
                .select('shippingcampaigns.interaction_id', 'shippingcampaigns.reg', 'shippingcampaigns.name', 'shippingcampaigns.cellphone', 'otherfields', 'phonevalid', 'messagesent', 'chats.created_at', 'response', 'returned', 'invalidresponse', 'chatname', 'absoluteresp')
                .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
                .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])
                .where('shippingcampaigns.interaction_id', 1)
                .whereRaw(query);
            return response.status(201).send(result);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async serviceEvaluationDashboard({ request, response }) {
        const { initialdate, finaldate, phonevalid, absoluteresp, interactions, returned, reg, name, attendant, doctor, unit, excluded, cellphone, chat_finished } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp',
            'interactions', 'returned', 'reg', 'name', 'attendant', 'doctor', 'unit', 'excluded', 'cellphone', 'chat_finished']);
        let query = "1=1";
        if (returned)
            query += ` and chats.id in (select chats_id from customchats) `;
        if (reg)
            query += ` and shippingcampaigns.reg=${reg} `;
        if (name)
            query += ` and shippingcampaigns.name like '%${name}%' `;
        if (phonevalid && phonevalid !== undefined) {
            query += ` and phonevalid=${phonevalid == 1 ? 1 : 0}`;
        }
        if (interactions)
            query += ` and response is not null `;
        if (cellphone)
            query += ` and shippingcampaigns.cellphone like '%${cellphone}%' `;
        if (absoluteresp == 1)
            query += ` and absoluteresp < 7 `;
        else if (absoluteresp == 2)
            query += ` and absoluteresp >= 7 and absoluteresp <9 `;
        else if (absoluteresp == 3)
            query += ` and absoluteresp >= 9 `;
        if (attendant)
            query += ` and attendant ='${attendant}'`;
        if (doctor)
            query += ` and doctor ='${doctor}' `;
        if (unit)
            query += ` and unit='${unit}'`;
        if (excluded)
            query += ` and excluded=1 `;
        else
            query += ` and (excluded not in (1) or excluded is null) `;
        if (chat_finished)
            query += ` and chat_finished=1 `;
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection(Env_1.default.get('DB_CONNECTION_MAIN')).query()
                .from('shippingcampaigns')
                .select('shippingcampaigns.id as idShipp', 'shippingcampaigns.interaction_id', 'shippingcampaigns.reg', 'shippingcampaigns.name', 'shippingcampaigns.cellphone', 'chats.id', 'otherfields', 'phonevalid', 'messagesent', 'chats.created_at', 'response', 'returned', 'invalidresponse', 'chatname', 'absoluteresp', 'prioritysend', 'excluded', 'doctor', 'unit', 'attendant', Database_1.default.raw('(select count(*) from customchats inner join chats ch on customchats.chats_id=ch.id where ch.id=chats.id and viewed=false) as viewed'), 'chat_finished')
                .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
                .whereBetween('chats.created_at', [initialdate, finaldate])
                .where('shippingcampaigns.interaction_id', 2)
                .whereRaw(query);
            const resultAcumulated = await Database_1.default.from('chats')
                .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
                .sumDistinct('absoluteresp as note')
                .count('* as total')
                .where('chats.interaction_id', 2)
                .andWhereBetween('absoluteresp', [0, 10000])
                .whereBetween('chats.created_at', [initialdate, finaldate])
                .whereRaw(query)
                .groupBy('absoluteresp');
            let resultAcumulatedList = resultAcumulated;
            let totalEvaluations = 0;
            let totalDetractors = 0;
            let totalPromoters = 0;
            for (const result of resultAcumulated) {
                totalEvaluations = totalEvaluations + result.total;
                if (result.note <= 6)
                    totalDetractors = totalDetractors + result.total;
                if (result.note >= 9 && result.note <= 10)
                    totalPromoters = totalPromoters + result.total;
            }
            const nps = ((totalPromoters * 100) / totalEvaluations) - ((totalDetractors * 100) / totalEvaluations);
            const npsResult = nps < 0 ? 0 : nps;
            const unitResult = await Database_1.default
                .from('chats')
                .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
                .where('chats.interaction_id', 2)
                .whereBetween('chats.created_at', [initialdate, finaldate])
                .andWhereRaw('(excluded not in (1) or excluded is null)')
                .select('unit as station')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp < 7 THEN 1 ELSE 0 END`), 'detrator')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp BETWEEN 7 AND 8 THEN 1 ELSE 0 END`), 'passivo')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp >= 9 THEN 1 ELSE 0 END`), 'promotor')
                .groupBy('unit');
            const resultByStation = unitResult.map(result => ({
                station: result.station,
                detrator: parseInt(result.detrator, 10),
                passivo: parseInt(result.passivo, 10),
                promotor: parseInt(result.promotor, 10)
            }));
            const doctorResult = await Database_1.default
                .from('chats')
                .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
                .where('chats.interaction_id', 2)
                .whereBetween('chats.created_at', [initialdate, finaldate])
                .andWhereRaw('(excluded not in (1) or excluded is null)')
                .select('doctor as medic')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp < 7 THEN 1 ELSE 0 END`), 'detrator')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp BETWEEN 7 AND 8 THEN 1 ELSE 0 END`), 'passivo')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp >= 9 THEN 1 ELSE 0 END`), 'promotor')
                .groupBy('doctor');
            const resultByMedic = doctorResult.map(result => ({
                medic: result.medic,
                detrator: parseInt(result.detrator, 10),
                passivo: parseInt(result.passivo, 10),
                promotor: parseInt(result.promotor, 10)
            }));
            const attendantResult = await Database_1.default
                .from('chats')
                .innerJoin('shippingcampaigns', 'chats.shippingcampaigns_id', 'shippingcampaigns.id')
                .where('chats.interaction_id', 2)
                .whereBetween('chats.created_at', [initialdate, finaldate])
                .andWhereRaw('(excluded not in (1) or excluded is null)')
                .select('attendant')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp < 7 THEN 1 ELSE 0 END`), 'detrator')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp BETWEEN 7 AND 8 THEN 1 ELSE 0 END`), 'passivo')
                .sum(Database_1.default.raw(`CASE WHEN absoluteresp >= 9 THEN 1 ELSE 0 END`), 'promotor')
                .groupBy('attendant');
            const resultByAttendant = attendantResult.map(result => ({
                attendant: result.attendant,
                detrator: parseInt(result.detrator, 10),
                passivo: parseInt(result.passivo, 10),
                promotor: parseInt(result.promotor, 10)
            }));
            return response.status(201).send({ result, resultAcumulatedList, resultByStation, resultByMedic, resultByAttendant, npsResult });
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async scheduleConfirmationDashboard({ request, response }) {
        const { initialdate, finaldate, phonevalid, absoluteresp, interactions, messagesent, invalidresponse, reg, name } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp', 'interactions', 'messagesent', 'reg', 'name']);
        let query = "1=1";
        if (phonevalid) {
            query += ` and phonevalid=${phonevalid}`;
        }
        if (messagesent) {
            query += ` and messagesent=${messagesent} and chats.interaction_seq not in (2)`;
        }
        if (interactions)
            query += ` and response is not null `;
        if (absoluteresp)
            query += ` and absoluteresp=${absoluteresp} and externalstatus='B' `;
        if (invalidresponse)
            query += ` and invalidresponse not in ('1','2', 'Sim', 'Não', 'confirmado', 'pode confirmar', '1sim', '10', 'cancelar', '2 cancelar') `;
        if (reg)
            query += ` and  shippingcampaigns.reg=${reg}`;
        if (name)
            query += ` and  shippingcampaigns.name like '%${name}%' `;
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection(Env_1.default.get('DB_CONNECTION_MAIN')).query()
                .from('shippingcampaigns')
                .select('shippingcampaigns.interaction_id', 'shippingcampaigns.reg', 'shippingcampaigns.name', 'shippingcampaigns.dateshedule', 'shippingcampaigns.cellphone', 'otherfields', 'phonevalid', 'messagesent', 'chats.created_at', 'response', 'returned', 'invalidresponse', 'chatname', 'absoluteresp')
                .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
                .whereBetween('shippingcampaigns.created_at', [initialdate, finaldate])
                .where('shippingcampaigns.interaction_id', 1)
                .whereRaw(query);
            return response.status(201).send(result);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async patientToSend() {
        const yesterday = luxon_1.DateTime.local().toFormat('yyyy-MM-dd 00:00');
        return await Shippingcampaign_1.default.query()
            .whereNull('phonevalid')
            .andWhere('messagesent', 0)
            .andWhere('created_at', '>', yesterday)
            .whereNotExists((query) => {
            query.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
        }).orderBy('prioritysend', "desc").first();
    }
}
exports.default = ShippingcampaignsController;
//# sourceMappingURL=ShippingcampaignsController.js.map