"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Customchat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Customchat"));
class CustomchatsController {
    async sendMessage({ params, request, response }) {
        const body = request.only(Customchat_1.default.fillable);
        body.messagesent = false;
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