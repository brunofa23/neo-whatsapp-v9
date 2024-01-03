"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const whatsappConnection_1 = require("../../Services/whatsapp-web/whatsappConnection");
class AgentsController {
    async index({ response }) {
        try {
            const data = await Agent_1.default.query();
            return response.status(200).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async store({ request, response }) {
        const body = request.only(Agent_1.default.fillable);
        try {
            const data = await Agent_1.default.create(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async update({ params, request, response }) {
        console.log('agent update:', params.id);
        const body = request.only(Agent_1.default.fillable);
        try {
            const data = await Agent_1.default.query().where('id', params.id)
                .update(body);
            return response.status(201).send(data);
        }
        catch (error) {
            return error;
        }
    }
    async connection({ params, request, response }) {
        try {
            const agent = await Agent_1.default.query().where('id', params.id).first();
            console.log("conectando...");
            await (0, whatsappConnection_1.startAgent)(agent);
            return response.status(201).send('Connected');
        }
        catch (error) {
            error;
        }
    }
    async connectionAll({ response }) {
        try {
            console.log("connection all acionado...");
            const agents = await Agent_1.default.query();
            for (const agent of agents) {
                console.log("Conectando agente:", agent.id);
                await (0, whatsappConnection_1.startAgent)(agent);
            }
            return response.status(201).send('ConnectedAll');
        }
        catch (error) {
            error;
        }
    }
}
exports.default = AgentsController;
//# sourceMappingURL=AgentsController.js.map