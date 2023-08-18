"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
<<<<<<< HEAD
=======
const fs = require('fs');
>>>>>>> main
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
    const timeSchedule = (luxon_1.DateTime.local().hour > 7 && luxon_1.DateTime.local().hour < 20) ? true : false;
    const message = !timeSchedule ? `Fora do Horario de Envio 7 às 19:${luxon_1.DateTime.local()}` : undefined;
    if (message)
        console.log(message);
    return timeSchedule;
}
<<<<<<< HEAD
module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule };
=======
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
    const positive = /(2|não|nao|cancelar|reagenda)/i;
    if (positive.test(stringResp)) {
        return true;
    }
    else {
        return false;
    }
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
module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, PositiveResponse, NegativeResponse, ClearFolder };
>>>>>>> main
//# sourceMappingURL=util.js.map