import { types } from '@ioc:Adonis/Core/Helpers'
import { ValidatePhone } from '../whatsapp-web/util'
import Log from 'App/Models/Log'

//const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')
async function verifyNumber(client, cellphone) {

  if (await !ValidatePhone(cellphone)) {
    await Log.create({ name: 'ValidatePhone', message: `erro 12211: número não validado:${cellphone}`, description: "Verificar na função ValidatePhone>> ARQUIVO:VerifyNumber.ts linha 9" })
    return null
  }
  if (types.isNull(cellphone) || cellphone == undefined || !cellphone) {
    await Log.create({name:'VerifyNumber', message:`erro 154215: número não validado:${cellphone} `,description:"ARQUIVO: VerifyNumber.ts linha 13" })
    return null
  }

  try {
    const verifiedPhone = await client.getNumberId(cellphone)
    if (verifiedPhone) {
      //console.log("válido", verifiedPhone)
      return verifiedPhone._serialized
    }
    else {
      //console.log("inválido", verifiedPhone)
      await Log.create({name:'verifiedPhone', message:`erro 568541: número não identificado no Whatsapp - ${cellphone} `,description:"VerifyNumber.ts linha:26" })
      return null
    }
  } catch (error) {
    return null
  }
}

module.exports = { verifyNumber }
