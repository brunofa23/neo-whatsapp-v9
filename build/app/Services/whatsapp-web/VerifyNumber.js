"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const util_1 = require("../whatsapp-web/util");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const luxon_1 = require("luxon");
const dayBefore5 = luxon_1.DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00');
async function verifyNumber(client, cellphone) {
    if (await !(0, util_1.ValidatePhone)(cellphone))
        return null;
    if (Helpers_1.types.isNull(cellphone) || cellphone == undefined || !cellphone)
        return null;
    try {
        const verifyClientSend = await Chat_1.default.query()
            .where('cellphone', cellphone)
            .andWhere('created_at', '>', dayBefore5)
            .andWhere('chatnumber', client.info.wid.user).first();
        if (verifyClientSend)
            return null;
        const verifiedPhone = await client.getNumberId(cellphone);
        if (verifiedPhone) {
            return verifiedPhone._serialized;
        }
        else {
            return null;
        }
    }
    catch (error) {
        return null;
    }
}
module.exports = { verifyNumber };
//# sourceMappingURL=VerifyNumber.js.map