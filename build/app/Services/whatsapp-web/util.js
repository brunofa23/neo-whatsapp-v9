"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCellphone = exports.chunckPhone = exports.validAgent = exports.RandomResponse = exports.ValidatePhone = exports.ClearFolder = exports.NegativeResponse = exports.PositiveResponse = exports.TimeSchedule = exports.GenerateRandomTime = exports.DateFormat = exports.stateTyping = exports.getTargetDates = void 0;
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
const luxon_1 = require("luxon");
const fs = require('fs');
async function stateTyping(message) {
    const chatTyping = await message.getChat();
    chatTyping.sendStateTyping();
    return await new Promise(resolve => setTimeout(resolve, 2000));
}
exports.stateTyping = stateTyping;
async function DateFormat(format, date = luxon_1.DateTime.local()) {
    if (!(date instanceof luxon_1.DateTime)) {
        throw new Error('A data fornecida não é válida. Certifique-se de passar um objeto DateTime.');
    }
    return date.toFormat(format);
}
exports.DateFormat = DateFormat;
async function GenerateRandomTime(min, max, method = "") {
    const _min = Math.ceil(min) * 1000;
    const _max = Math.ceil(max) * 1000;
    const randomTime = Math.floor(Math.random() * (_max - _min) + _min);
    return randomTime;
}
exports.GenerateRandomTime = GenerateRandomTime;
async function TimeSchedule() {
    const now = luxon_1.DateTime.local().setZone('America/Sao_Paulo');
    const timeSchedule = (now.hour > 5 && now.hour < 21);
    const message = !timeSchedule ? `Fora do Horario de Envio 7 às 19: ${now.toFormat('dd/MM/yyyy HH:mm:ss')}` : undefined;
    if (message)
        console.log(message);
    return timeSchedule;
}
exports.TimeSchedule = TimeSchedule;
async function PositiveResponse(inputString) {
    const positiveResponses = [
        "1", "sim", "ok", "pode sim", "confirma", "com certeza",
        "afirmativo", "sim claro", "pode confirmar"
    ];
    const normalizedInput = inputString.trim().toLowerCase();
    return positiveResponses.some(response => normalizedInput.includes(response));
}
exports.PositiveResponse = PositiveResponse;
async function NegativeResponse(stringResp) {
    const negativeResponses = [
        "2", "não", "nao", "cancelar", "reagenda", "desmarcar", "não pode",
        "não quero", "não consigo", "negativo", "nunca", "recusar"
    ];
    const normalizedInput = stringResp.trim().toLowerCase();
    return negativeResponses.some(response => normalizedInput.includes(response));
}
exports.NegativeResponse = NegativeResponse;
async function RandomResponse(arrayResponse) {
    const index = Math.floor(Math.random() * arrayResponse.length);
    return arrayResponse[index];
}
exports.RandomResponse = RandomResponse;
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
exports.ClearFolder = ClearFolder;
async function ValidatePhone(cellphone) {
    if (!cellphone)
        return null;
    const digits = cellphone.replace(/\D/g, '');
    if (digits.length < 10)
        return null;
    let normalized = '';
    if (digits.length === 11) {
        normalized = '55' + digits;
    }
    else if (digits.length === 10) {
        normalized = '55' + digits.slice(0, 2) + '9' + digits.slice(2);
    }
    else if (digits.length === 13 && digits.startsWith('55')) {
        normalized = digits;
    }
    else {
        return null;
    }
    const celularRegex = /^55[1-9]{2}9\d{8}$/;
    if (!celularRegex.test(normalized))
        return null;
    return normalized;
}
exports.ValidatePhone = ValidatePhone;
async function validAgent(agent) {
    console.log("Rodando valid agent...");
    await Agent_1.default.query()
        .where('id', agent.id)
        .update({ statusconnected: false });
}
exports.validAgent = validAgent;
async function chunckPhone(cellphone) {
    const match = cellphone.match(/(\d{8})@c\.us$/);
    if (match) {
        return match[1];
    }
    if (!cellphone.includes('@')) {
        return cellphone;
    }
    return cellphone.split('@')[0];
}
exports.chunckPhone = chunckPhone;
async function extractCellphone(mascara) {
    return mascara.replace(/^55/, '').replace(/@.*/, '');
}
exports.extractCellphone = extractCellphone;
function getTargetDates() {
    const today = luxon_1.DateTime.local().setZone('America/Sao_Paulo');
    const weekday = today.weekday;
    let dates = [];
    switch (weekday) {
        case 1:
            dates.push(today.plus({ days: 2 }));
            break;
        case 2:
            dates.push(today.plus({ days: 2 }));
            break;
        case 3:
            dates.push(today.plus({ days: 2 }));
            break;
        case 4:
            dates.push(today.plus({ days: 2 }));
            dates.push(today.plus({ days: 4 }));
            break;
        case 5:
            dates.push(today.plus({ days: 4 }));
            break;
        default:
            console.warn("Hoje não é um dia útil esperado (segunda a sexta).");
            break;
    }
    return dates;
}
exports.getTargetDates = getTargetDates;
//# sourceMappingURL=util.js.map