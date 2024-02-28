"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
class ConfigsController {
    async index({ response }) {
        try {
            const data = await Config_1.default.query();
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async show({ auth, params, response }) {
        const data = await Config_1.default.query().where('id', params.id).first();
        return response.status(200).send(data);
    }
    async update({ params, request, response }) {
        const body = request.only(Config_1.default.fillable);
        try {
            const data = await Config_1.default.query().where('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = ConfigsController;
//# sourceMappingURL=ConfigsController.js.map