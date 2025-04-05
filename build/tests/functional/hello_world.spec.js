"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const IdentifyAnswer_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/IdentifyAnswer");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    console.log('*******TESTES');
    const answer = await (0, IdentifyAnswer_1.interpretAnswer)("não sou bruno");
    console.log(">>>>>", answer);
});
//# sourceMappingURL=hello_world.spec.js.map