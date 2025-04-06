"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    console.log('*******TESTES');
    const chunckPhoneNumber = await (0, util_1.chunckPhone)('31985228619@');
    const query1 = Shippingcampaign_1.default.query()
        .where('cellphone', 'like', `%${await (0, util_1.chunckPhone)('31985228619')}%`)
        .where('interaction_id', 1);
    console.log("::::::", chunckPhoneNumber);
    console.log("::::::", query1.toQuery());
    const query = await query1;
    const context = query.map((item) => `name:${item.name} \n${item.otherfields}`).join("\n");
    console.log("::::::", context);
});
//# sourceMappingURL=hello_world.spec.js.map