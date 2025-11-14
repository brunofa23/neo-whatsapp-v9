"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    console.log(luxon_1.DateTime.now()
        .setZone('America/Sao_Paulo'));
});
//# sourceMappingURL=hello_world.spec.js.map