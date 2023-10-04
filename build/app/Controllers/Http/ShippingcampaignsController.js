"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const whatsapp_1 = require("../../Services/whatsapp-web/whatsapp");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const util_1 = require("../../Services/whatsapp-web/util");
const luxon_1 = require("luxon");
class ShippingcampaignsController {
    static get connection() {
        return 'mssql2';
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
    async maxLimitSendMessage() {
        const dateStart = await (0, util_1.DateFormat)("yyyy-MM-dd 00:00:00", luxon_1.DateTime.local());
        const dateEnd = await (0, util_1.DateFormat)("yyyy-MM-dd 23:59:00", luxon_1.DateTime.local());
        const chatName = process.env.CHAT_NAME;
        const countMessage = await Chat_1.default.query()
            .countDistinct('shippingcampaigns_id as tot')
            .where('chatname', String(chatName))
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
        const { initialdate, finaldate } = request.only(['initialdate', 'finaldate']);
        if (!luxon_1.DateTime.fromISO(initialdate).isValid || !luxon_1.DateTime.fromISO(finaldate).isValid) {
            throw new Error("Datas inválidas.");
        }
        try {
            const result = await Database_1.default.connection('mssql2').query()
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
                .orderByRaw(Database_1.default.raw('CONVERT(date, shippingcampaigns.created_at)'));
            return response.status(201).send(result);
        }
        catch (error) {
            throw new Error(error);
        }
    }
}
exports.default = ShippingcampaignsController;
//# sourceMappingURL=ShippingcampaignsController.js.map