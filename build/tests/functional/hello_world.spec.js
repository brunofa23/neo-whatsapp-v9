"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const SendFromQueueGupshup_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-gupshup/SendFromQueueGupshup"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const agent = await Agent_1.default.findOrFail(588);
    await (0, SendFromQueueGupshup_1.default)(agent);
});
//# sourceMappingURL=hello_world.spec.js.map