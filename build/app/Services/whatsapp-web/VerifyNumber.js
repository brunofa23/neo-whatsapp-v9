"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Helpers_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Helpers");
const util_1 = require("../whatsapp-web/util");
async function verifyNumber(client, cellphone) {
    if (await !(0, util_1.ValidatePhone)(cellphone))
        return null;
    if (Helpers_1.types.isNull(cellphone) || cellphone == undefined || !cellphone)
        return null;
    try {
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