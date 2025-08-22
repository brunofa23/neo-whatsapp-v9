"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const aiResponder_1 = global[Symbol.for('ioc.use')]("App/Services/Ai/aiResponder");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const response = await (0, aiResponder_1.responderPergunta)("Qual endereço de Santa Efigênia", `Gostaria de saber o endereço  da clínica neo visão do bairro Santa Efigenia obrigada`);
    console.log(response);
});
//# sourceMappingURL=hello_world.spec.js.map