async function verifyNumber(client, cellphone) {

  if (!validatePhone(cellphone))
    return null
  if (cellphone == null || cellphone == undefined || !cellphone)
    return null

  try {
    const verifiedPhone = await client.getNumberId(cellphone)
    if (verifiedPhone) {
      //console.log("válido", verifiedPhone)
      return verifiedPhone._serialized
    }
    else {
      //console.log("inválido", verifiedPhone)
      return null
    }
  } catch (error) {
    return null
  }
}

function validatePhone(cellphone) {
  // Expressão regular para validar o formato de um número de celular no Brasil
  const regexTelefoneCelular = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
  return regexTelefoneCelular.test(cellphone);
}

module.exports = { verifyNumber }
