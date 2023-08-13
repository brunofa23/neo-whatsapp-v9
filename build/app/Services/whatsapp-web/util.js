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
async function GenerateRandomTime(min, max, method = "") {
    const _min = Math.ceil(min) * 1000;
    const _max = Math.ceil(max) * 1000;
    const randomTime = Math.floor(Math.random() * (_max - _min) + _min);
    return randomTime;
}
async function TimeSchedule() {
    return true;
    const timeSchedule = (luxon_1.DateTime.local().hour > 7 && luxon_1.DateTime.local().hour < 20) ? true : false;
    const message = !timeSchedule ? `Fora do Horario de Envio 7 às 19:${luxon_1.DateTime.local()}` : undefined;
    if (message)
        console.log(message);
    return timeSchedule;
}
module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule };
//# sourceMappingURL=util.js.map