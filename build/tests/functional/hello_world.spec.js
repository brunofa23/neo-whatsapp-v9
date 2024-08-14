"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const ResponsesController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ResponsesController"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const teste = new ResponsesController_1.default();
    const list = await teste.index({ local: 'presentation' });
    console.log(">>>>>>>>>>>>>>>>>>>", list);
});
//# sourceMappingURL=hello_world.spec.js.map