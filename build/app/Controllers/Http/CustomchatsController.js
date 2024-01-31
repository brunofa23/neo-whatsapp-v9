"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
class CustomchatsController {
    async show({ auth, params, response }) {
        const data = await Customchat_1.default.query().where('chats_id', params.id);
        return response.status(200).send(data);
    }
    async sendMessage({ request, response }) {
        const body = request.only(Customchat_1.default.fillable);
        body.messagesent = false;
        console.log("Passei aqui 45888", body);
        try {
            const payLoad = await Customchat_1.default.create(body);
            return response.status(201).send(payLoad);
        }
        catch (error) {
            error;
        }
    }
}
exports.default = CustomchatsController;
//# sourceMappingURL=CustomchatsController.js.map