"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mainsubject_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Mainsubject"));
class MainsubjectsController {
    async index({ auth, response }) {
        await auth.use('api').authenticate();
        try {
            const data = await Mainsubject_1.default.query().where('excluded', 0);
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = MainsubjectsController;
//# sourceMappingURL=MainsubjectsController.js.map