"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const teste = await (0, util_1.ValidatePhone)('31934982241');
    console.log("TESTE:", teste);
});
//# sourceMappingURL=hello_world.spec.js.map