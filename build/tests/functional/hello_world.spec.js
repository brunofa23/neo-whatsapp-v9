"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const agentMaxLimitSend = await Agent_1.default.query().where('id', 75).first();
    if (agentMaxLimitSend == undefined || agentMaxLimitSend?.max_limit_message == undefined)
        console.log("SEM RETORNO VALOR ZERO:::");
    else
        console.log("limite maximo:", agentMaxLimitSend?.max_limit_message);
});
//# sourceMappingURL=hello_world.spec.js.map