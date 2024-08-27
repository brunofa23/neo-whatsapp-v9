"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    await Log_1.default.create({ name: 'ValidatePhone', message: 'erro 12211: número não validado', description: "Verificar na função ValidatePhone" });
});
//# sourceMappingURL=hello_world.spec.js.map