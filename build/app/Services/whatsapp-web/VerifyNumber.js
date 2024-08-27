"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const util_1 = require("../whatsapp-web/util");
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
async function verifyNumber(client, cellphone) {
    if (await !(0, util_1.ValidatePhone)(cellphone)) {
        await Log_1.default.create({ name: 'ValidatePhone', message: `erro 12211: número não validado:${cellphone}`, description: "Verificar na função ValidatePhone>> ARQUIVO:VerifyNumber.ts linha 9" });
        return null;
    }
    if (Helpers_1.types.isNull(cellphone) || cellphone == undefined || !cellphone) {
        await Log_1.default.create({ name: 'VerifyNumber', message: `erro 154215: número não validado:${cellphone} `, description: "ARQUIVO: VerifyNumber.ts linha 13" });
        return null;
    }
    try {
        const verifiedPhone = await client.getNumberId(cellphone);
        if (verifiedPhone) {
            return verifiedPhone._serialized;
        }
        else {
            await Log_1.default.create({ name: 'verifiedPhone', message: `erro 568541: número não identificado no Whatsapp - ${cellphone} `, description: "VerifyNumber.ts linha:26" });
            return null;
        }
    }
    catch (error) {
        return null;
    }
}
module.exports = { verifyNumber };
//# sourceMappingURL=VerifyNumber.js.map