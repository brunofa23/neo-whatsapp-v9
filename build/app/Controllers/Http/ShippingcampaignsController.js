"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const whatsapp_1 = require("../../Services/whatsapp-web/whatsapp");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const util_1 = require("../../Services/whatsapp-web/util");
const luxon_1 = require("luxon");
class ShippingcampaignsController {
    static get connection() {
        return 'mysql';
    }
    async index({ response, request }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default.all();
            return response.status(200).send(shippingCampaign);
        }
        catch (error) {
            return error;
        }
    }
    async store({ response, request }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default
                .query();
            return response.status(200).send(shippingCampaign);
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
    async resetWhatsapp() {
        await whatsapp_1.executeWhatsapp;
    }
    async chat({ response, request }) {
        const id = 567508;
        const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}`;
        try {
            console.log("EXECUTANDO UPDATE NO SMART...", query);
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
        console.log("ENTREI NO DAYPOSITION..");
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
        console.log("PASSEI DATEPOSITION");
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
            console.log(">>>>>>>>>>", result);
            return response.status(201).send(result);
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async datePositionSynthetic({ request, response }) {
        console.log("PASSEI DATEPOSITION");
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
        console.log("phonevalid", phonevalid);
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
        const { initialdate, finaldate, phonevalid, absoluteresp, interactions } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp', 'interactions']);
        let query = "1=1";
        if (phonevalid && phonevalid !== undefined) {
            query += ` and phonevalid=${phonevalid == 1 ? 1 : 0}`;
        }
        if (interactions)
            query += ` and response is not null `;
        if (absoluteresp == 1)
            query += ` and absoluteresp < 7 `;
        else if (absoluteresp == 2)
            query += ` and absoluteresp >= 7 and absoluteresp <9 `;
        else if (absoluteresp == 3)
            query += ` and absoluteresp >= 9 `;
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection(Env_1.default.get('DB_CONNECTION_MAIN')).query()
                .from('shippingcampaigns')
                .select('shippingcampaigns.interaction_id', 'shippingcampaigns.reg', 'shippingcampaigns.name', 'shippingcampaigns.cellphone', 'chats.id', 'otherfields', 'phonevalid', 'messagesent', 'chats.created_at', 'response', 'returned', 'invalidresponse', 'chatname', 'absoluteresp')
                .leftJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
                .whereBetween('chats.created_at', [initialdate, finaldate])
                .where('shippingcampaigns.interaction_id', 2)
                .whereRaw(query);
            const resultAcumulated = await Chat_1.default.query()
                .sumDistinct('absoluteresp as note')
                .count('* as total')
                .where('interaction_id', 2)
                .andWhereBetween('absoluteresp', [0, 10])
                .whereBetween('created_at', [initialdate, finaldate])
                .groupBy('absoluteresp');
            let resultAcumulatedList = [];
            let totalEvaluations = 0;
            let totalDetractors = 0;
            let totalPromoters = 0;
            for (const result of resultAcumulated) {
                resultAcumulatedList.push(result.$extras);
                totalEvaluations = totalEvaluations + result.$extras.total;
                if (result.$extras.note <= 6)
                    totalDetractors = totalDetractors + result.$extras.total;
                if (result.$extras.note >= 9 && result.$extras.note <= 10)
                    totalPromoters = totalPromoters + result.$extras.total;
            }
            const npsResult = ((totalPromoters * 100) / totalEvaluations) - ((totalDetractors * 100) / totalEvaluations);
            const otherfields = result.map(item => JSON.parse(item.otherfields));
            const station = otherfields.map(item => item.station);
            const medic = otherfields.map(item => item.medic);
            let itemFilter;
            const resultFinal = result.map(item => {
                const otherfieldsObj = JSON.parse(item.otherfields);
                return {
                    ...item,
                    station: otherfieldsObj.station,
                    medic: otherfieldsObj.medic,
                    attendant: otherfieldsObj.attendant
                };
            });
            function getClassification(score) {
                if (score <= 7) {
                    return 'detrator';
                }
                else if (score > 7 && score <= 8) {
                    return 'passivo';
                }
                else if (score > 8 && score <= 10) {
                    return 'promotor';
                }
            }
            const countsByStation = {};
            const countsByMedic = {};
            const countsByAttendant = {};
            resultFinal.forEach(item => {
                const { attendant, station, absoluteresp, medic } = item;
                const classification = getClassification(absoluteresp);
                if (item.messagesent && item.absoluteresp !== null) {
                    if (!countsByStation[station]) {
                        countsByStation[station] = {
                            detrator: 0,
                            passivo: 0,
                            promotor: 0
                        };
                    }
                    countsByStation[station][classification]++;
                }
                if (item.messagesent && item.absoluteresp !== null) {
                    if (!countsByMedic[medic]) {
                        countsByMedic[medic] = {
                            detrator: 0,
                            passivo: 0,
                            promotor: 0
                        };
                    }
                    countsByMedic[medic][classification]++;
                }
                if (item.messagesent && item.absoluteresp !== null) {
                    if (!countsByAttendant[attendant]) {
                        countsByAttendant[attendant] = {
                            detrator: 0,
                            passivo: 0,
                            promotor: 0
                        };
                    }
                    countsByAttendant[attendant][classification]++;
                }
            });
            const resultByStation = Object.entries(countsByStation).map(([station, counts]) => ({
                station,
                ...counts
            }));
            const resultByMedic = Object.entries(countsByMedic).map(([medic, counts]) => ({
                medic,
                ...counts
            }));
            const resultByAttendant = Object.entries(countsByAttendant).map(([attendant, counts]) => ({
                attendant,
                ...counts
            }));
            return response.status(201).send({ result, resultAcumulatedList, resultByStation, resultByMedic, resultByAttendant, npsResult });
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async scheduleConfirmationDashboard({ request, response }) {
        const { initialdate, finaldate, phonevalid, absoluteresp, interactions, messagesent, invalidresponse } = request.only(['initialdate', 'finaldate', 'phonevalid', 'invalidresponse', 'absoluteresp', 'interactions', 'messagesent']);
        let query = "1=1";
        if (phonevalid) {
            query += ` and phonevalid=${phonevalid}`;
        }
        if (messagesent) {
            query += ` and messagesent=${messagesent} `;
        }
        if (interactions)
            query += ` and response is not null `;
        if (absoluteresp)
            query += ` and absoluteresp=${absoluteresp} `;
        if (invalidresponse)
            query += ` and invalidresponse not in ('1','2', 'Sim', 'Não', 'confirmado', 'pode confirmar', '1sim', '10', 'cancelar', '2 cancelar') `;
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection(Env_1.default.get('DB_CONNECTION_MAIN')).query()
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
}
exports.default = ShippingcampaignsController;
//# sourceMappingURL=ShippingcampaignsController.js.map