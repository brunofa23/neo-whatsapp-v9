"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const data = await Agent_1.default.query().whereNull('deleted').orWhere('deleted', false);
    console.log(data);
});
//# sourceMappingURL=hello_world.spec.js.map