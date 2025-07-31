"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Manifest_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Manifest"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const query = Manifest_1.default.query()
        .where('chat_id', 7348)
        .first();
    const data = await query;
    if (data?.mainsubject_id)
        await data.load('mainsubject');
    if (data?.chat_id)
        await data.load('chat');
    if (data?.user_responsible_id)
        await data.load('user');
    console.log("DATA::::", data);
});
//# sourceMappingURL=hello_world.spec.js.map