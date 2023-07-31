async function verifyNumber(client, cellphone) {
    if (!validatePhone(cellphone))
        return null;
    if (cellphone == null || cellphone == undefined)
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
function validatePhone(cellphone) {
    const regexTelefoneCelular = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
    return regexTelefoneCelular.test(cellphone);
}
module.exports = { verifyNumber };
//# sourceMappingURL=VerifyNumber.js.map