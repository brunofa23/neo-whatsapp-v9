"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyNumber = void 0;
const util_1 = require("../whatsapp-web/util");
const Log_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Log"));
async function isClientReady(client) {
    try {
        const state = await client.getState();
        return state === 'CONNECTED' || state === 'READY';
    }
    catch (err) {
        return false;
    }
}
async function verifyNumber(client, cellphone) {
    const formattedPhone = await (0, util_1.ValidatePhone)(cellphone);
    if (!formattedPhone) {
        await Log_1.default.create({
            name: 'VerifyNumber',
            message: `Erro 12211: Número inválido ou não validado - ${cellphone}`,
            description: "Função validateAndFormatPhone falhou. Arquivo: VerifyNumber.ts"
        });
        return 'INVALID';
    }
    const ready = await isClientReady(client);
    if (!ready) {
        await Log_1.default.create({
            name: 'VerifyNumber',
            message: `Erro 70001: Cliente WhatsApp não está pronto`,
            description: "client.getState() não retornou estado válido. Arquivo: VerifyNumber.ts"
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
        return 'INVALID';
    }
    catch (error) {
        const isSessionClosed = error.message?.includes('Session closed');
        const isProtocolError = error.message?.includes('Protocol error');
        await Log_1.default.create({
            name: 'VerifyNumber',
            message: `Erro 999999: Falha ao verificar número - ${cellphone}`,
            description: `Erro capturado: ${error.message}${isSessionClosed ? ' (Sessão encerrada)' : ''}. Arquivo: VerifyNumber.ts`
        });
        if (isSessionClosed || isProtocolError) {
            console.warn(`A sessão do cliente pode ter sido encerrada. Considere reinicializar.`);
        }
        return null;
    }
}
exports.verifyNumber = verifyNumber;
//# sourceMappingURL=VerifyNumber.js.map