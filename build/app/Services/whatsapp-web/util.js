"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const luxon_1 = require("luxon");
const fs = require('fs');
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
    const timeSchedule = (luxon_1.DateTime.local().hour > 5 && luxon_1.DateTime.local().hour < 24) ? true : false;
    const message = !timeSchedule ? `Fora do Horario de Envio 7 às 19:${luxon_1.DateTime.local()}` : undefined;
    if (message)
        console.log(message);
    return timeSchedule;
}
async function PositiveResponse(inputString) {
    const regex = /(1|sim|ok|pode sim|confirma)/i;
    if (regex.test(inputString)) {
        return true;
    }
    else {
        return false;
    }
}
async function NegativeResponse(stringResp) {
    const positive = /(2|não|nao|cancelar|reagenda|desmarcar)/i;
    if (positive.test(stringResp)) {
        return true;
    }
    else {
        return false;
    }
}
async function InvalidResponse(stringResp) {
    const positive = /sim|não|1|2|pode confirmar|confirmada/ig;
    if (positive.test(stringResp)) {
        return true;
    }
    else {
        return false;
    }
}
async function RandomResponse(arrayResponse) {
    const index = Math.floor(Math.random() * arrayResponse.length);
    return arrayResponse[index];
}
async function ClearFolder(folderPath) {
    try {
        if (!fs.existsSync(folderPath)) {
            return;
        }
        else {
            fs.unlink(`${folderPath}`, (err) => {
                if (err) {
                    throw "ERRO DELETE::" + err;
                }
                console.log("Delete File successfully.");
                return true;
            });
        }
    }
    catch (error) {
    }
}
async function ValidatePhone(cellphone) {
    const regexTelefoneCelular = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
    return regexTelefoneCelular.test(cellphone);
}
async function validAgent(agent) {
    console.log("Rodando valid agent...");
    await Agent_1.default.query()
        .where('id', agent.id)
        .update({ statusconnected: false });
}
module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, PositiveResponse, NegativeResponse, ClearFolder, ValidatePhone, RandomResponse, InvalidResponse, validAgent };
//# sourceMappingURL=util.js.map