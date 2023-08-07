"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
async function stateTyping(message) {
    const chatTyping = await message.getChat();
    chatTyping.sendStateTyping();
    return await new Promise(resolve => setTimeout(resolve, 3000));
}
async function DateFormat(format, date = luxon_1.DateTime.local()) {
    if (!(date instanceof luxon_1.DateTime)) {
        throw new Error('A data fornecida não é válida. Certifique-se de passar um objeto DateTime.');
    }
    return date.toFormat(format);
}
async function GenerateRandomTime(min, max) {
    const randomValue = Math.random();
    const range = max - min;
    const scaledValue = randomValue * range;
    const shiftedValue = scaledValue + min;
    const finalValue = Math.round(shiftedValue * 1000);
    return finalValue;
}
module.exports = { stateTyping, DateFormat, GenerateRandomTime };
//# sourceMappingURL=util.js.map