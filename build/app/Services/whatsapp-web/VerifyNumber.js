"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyNumber = void 0;
const util_1 = require("../whatsapp-web/util");
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
        return 'INVALID';
    }
    const ready = await isClientReady(client);
    if (!ready) {
        return null;
    }
    try {
        const verifiedPhone = await client.getNumberId(cellphone);
        if (verifiedPhone) {
            return verifiedPhone._serialized;
        }
        return 'INVALID';
    }
    catch (error) {
        const isSessionClosed = error.message?.includes('Session closed');
        const isProtocolError = error.message?.includes('Protocol error');
        if (isSessionClosed || isProtocolError) {
            console.warn(`A sessão do cliente pode ter sido encerrada. Considere reinicializar.`);
        }
        return null;
    }
}
exports.verifyNumber = verifyNumber;
//# sourceMappingURL=VerifyNumber.js.map