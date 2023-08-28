import { types } from '@ioc:Adonis/Core/Helpers'

import { ValidatePhone } from '../whatsapp-web/util'

async function verifyNumber(client, cellphone) {

  if (await !ValidatePhone(cellphone))
    return null
  if (types.isNull(cellphone) || cellphone == undefined || !cellphone)
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

module.exports = { verifyNumber }
