"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Manifest_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Manifest"));
const sendMail_1 = global[Symbol.for('ioc.use')]("App/Services/mail/sendMail");
class ManifestsController {
    async index({ auth, response }) {
    }
    async show({ auth, params, response }) {
        try {
            const data = await Manifest_1.default.query().where('chat_id', params.id);
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async store({ auth, request, response }) {
        await auth.use('api').authenticate();
        const body = request.only(Manifest_1.default.fillable);
        try {
            const data = await Manifest_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        const body = request.only(Manifest_1.default.fillable);
        try {
            const data = await Manifest_1.default.query().where('id', params.id)
                .update(body);
            const sendmail = await (0, sendMail_1.sendMailManifest)();
            console.log("@@@@@", sendmail);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async sendMailManifest({ auth, params, request, response }) {
        console.log("entrei aqui", params.id);
        await auth.use('api').authenticate();
        const { report } = request.only(['report']);
        try {
            const data = await Manifest_1.default.query()
                .where('chat_id', params.id)
                .preload('user')
                .preload('mainsubject')
                .preload('chat')
                .first();
            if (!data)
                return;
            const sendmail = await (0, sendMail_1.sendMailManifest)(data, report);
            return response.status(201).send(sendmail);
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = ManifestsController;
//# sourceMappingURL=ManifestsController.js.map