"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const dateStr = "2025-10-12";
    const today = luxon_1.DateTime.fromISO(dateStr, { zone: "America/Sao_Paulo" });
    console.log(">>>>>", today);
    let daysToAdd = null;
    if (today.weekday >= 1 && today.weekday <= 4) {
        daysToAdd = 2;
    }
    else if (today.weekday === 5) {
        daysToAdd = 3;
    }
    else if (today.weekday === 6) {
        console.log("!!!!!!");
        daysToAdd = 3;
    }
    else if (today.weekday === 7) {
        return;
    }
    const date = today.plus({ days: daysToAdd }).toFormat("yyyy-MM-dd");
    console.log(date);
});
//# sourceMappingURL=hello_world.spec.js.map