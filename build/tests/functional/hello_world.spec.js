"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    let date = luxon_1.DateTime.now().plus({ days: 3 });
    if (date.weekday === 6) {
        date = date.plus({ days: 2 });
    }
    else if (date.weekday === 7) {
        date = date.plus({ days: 1 });
    }
    date = date.toFormat("yyyy-MM-dd");
    console.log("Date:", date);
});
//# sourceMappingURL=hello_world.spec.js.map