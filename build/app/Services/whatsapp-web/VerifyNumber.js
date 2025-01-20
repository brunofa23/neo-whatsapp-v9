"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyNumber = void 0;
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const util_1 = require("../whatsapp-web/util");
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
async function verifyNumber(client, cellphone) {
    if (!cellphone || Helpers_1.types.isNull(cellphone) || cellphone == undefined || !await (0, util_1.ValidatePhone)(cellphone)) {
        await Log_1.default.create({
            name: 'VerifyNumber',
            message: `Erro 12211: Número inválido ou não validado - ${cellphone}`,
            description: "Função ValidatePhone falhou. Arquivo: VerifyNumber.ts"
        });
        return null;
    }
    try {
        const verifiedPhone = await client.getNumberId(cellphone);
        if (verifiedPhone) {
            return verifiedPhone._serialized;
        }
        await Log_1.default.create({
            name: 'VerifyNumber',
            message: `Erro 568541: Número não identificado no WhatsApp - ${cellphone}`,
            description: "Função client.getNumberId retornou null. Arquivo: VerifyNumber.ts"
        });
        return null;
    }
    catch (error) {
        await Log_1.default.create({
            name: 'VerifyNumber',
            message: `Erro 999999: Falha ao verificar número - ${cellphone}`,
            description: `Erro capturado: ${error.message}. Arquivo: VerifyNumber.ts`
        });
        return null;
    }
}
exports.verifyNumber = verifyNumber;
//# sourceMappingURL=VerifyNumber.js.map