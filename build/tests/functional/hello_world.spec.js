"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const util_1 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    try {
        const teste = await (0, util_1.extractCellphone)('');
        console.log('*******TESTES', teste);
    }
    catch (error) {
        console.error('Erro no teste:', error);
    }
});
//# sourceMappingURL=hello_world.spec.js.map