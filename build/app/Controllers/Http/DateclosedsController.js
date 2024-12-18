"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Dateclosed_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Dateclosed"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const luxon_1 = require("luxon");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
class DateclosedsController {
    async index({ auth, request, response }) {
        await auth.use('api').authenticate();
        const { month, year } = request.only(['month', 'year']);
        try {
            const query = Dateclosed_1.default.query();
            if (month && year) {
                query.where('month', month);
                query.andWhere('year', year);
            }
            query.orderBy('year', 'desc');
            query.orderBy('month', 'desc');
            const data = await query;
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async store({ auth, request, response }) {
        await auth.use('api').authenticate();
        const body = request.only(Dateclosed_1.default.fillable);
        if (body.month == null || body.year == null) {
            return response.status(401).send('values nulls');
        }
        const startOfMonth = luxon_1.DateTime.local(parseInt(body.year), parseInt(body.month)).startOf("month").toFormat("yyyy-MM-dd");
        const endOfMonth = luxon_1.DateTime.local(parseInt(body.year), parseInt(body.month)).endOf("month").toFormat("yyyy-MM-dd");
        ;
        const trx = await Database_1.default.transaction();
        try {
            const data = await Dateclosed_1.default.create(body, { client: trx });
            await Chat_1.default.query()
                .where('created_at', '>=', startOfMonth)
                .andWhere('created_at', '<=', endOfMonth)
                .andWhere('interaction_id', 2)
                .useTransaction(trx)
                .update({ closed: true });
            await trx.commit();
            return response.status(201).send(data);
        }
        catch (error) {
            await trx.rollback();
            return response.status(409).send(error);
        }
    }
    async destroy({ auth, params, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await Dateclosed_1.default.findOrFail(params.id);
            await data.delete();
            return response.status(204).send("Excluído com sucesso!!");
        }
        catch (error) {
            throw new BadRequestException_1.default('Bad Request', 401, error);
        }
    }
}
exports.default = DateclosedsController;
//# sourceMappingURL=DateclosedsController.js.map