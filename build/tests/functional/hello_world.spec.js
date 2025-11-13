"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const ShippingcampaignsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ShippingcampaignsController"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const shippingcampaignsController = new ShippingcampaignsController_1.default();
    const agent = await Agent_1.default.query().where('id', 472).first();
    if (agent) {
        const shippingCampaign = await shippingcampaignsController.patientToSend(agent);
        console.log("!!!!retorno", shippingCampaign?.file_path);
        if (shippingCampaign?.file_path)
            console.log("EXISTE ARQUIVO PARA ENVIAR");
    }
});
//# sourceMappingURL=hello_world.spec.js.map