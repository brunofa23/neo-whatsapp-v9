"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const luxon_1 = require("luxon");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const date_return = luxon_1.DateTime.now().toFormat("yyyy-MM-dd HH:mm");
    await Chat_1.default.query().where('id', 117139).update({ date_return });
});
//# sourceMappingURL=hello_world.spec.js.map