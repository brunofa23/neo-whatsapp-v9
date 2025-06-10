"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    let date = luxon_1.DateTime.local().setZone('America/Sao_Paulo').plus({ days: 2 });
    console.log("DATE::", date);
});
//# sourceMappingURL=hello_world.spec.js.map