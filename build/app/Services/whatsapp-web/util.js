"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
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
async function ExecutingSendMessage(value) {
    const config = await Config_1.default.find('executingSendMessage');
    config.valuebool = value;
    await config.save();
}
module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, ExecutingSendMessage };
//# sourceMappingURL=util.js.map