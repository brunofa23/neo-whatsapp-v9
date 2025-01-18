import { types } from '@ioc:Adonis/Core/Helpers'
import { ValidatePhone } from '../whatsapp-web/util'
import Log from 'App/Models/Log'

//const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')
// async function verifyNumber(client, cellphone) {

//   if (await !ValidatePhone(cellphone)) {
//     await Log.create({ name: 'ValidatePhone', message: `erro 12211: número não validado:${cellphone}`, description: "Verificar na função ValidatePhone>> ARQUIVO:VerifyNumber.ts linha 9" })
//     return null
//   }
//   if (types.isNull(cellphone) || cellphone == undefined || !cellphone) {
//     await Log.create({name:'VerifyNumber', message:`erro 154215: número não validado:${cellphone} `,description:"ARQUIVO: VerifyNumber.ts linha 13" })
//     return null
//   }

//   try {
//     const verifiedPhone = await client.getNumberId(cellphone)
//     if (verifiedPhone) {
//       //console.log("válido", verifiedPhone)
//       return verifiedPhone._serialized
//     }
//     else {
//       //console.log("inválido", verifiedPhone)
//       await Log.create({name:'verifiedPhone', message:`erro 568541: número não identificado no Whatsapp - ${cellphone} `,description:"VerifyNumber.ts linha:26" })
//       return null
//     }
//   } catch (error) {
//     return null
//   }
// }

 // export {verifyNumber}

 async function verifyNumber(client, cellphone) {
  if (!cellphone || !await ValidatePhone(cellphone)) {
    await Log.create({
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

    await Log.create({
      name: 'VerifyNumber',
      message: `Erro 568541: Número não identificado no WhatsApp - ${cellphone}`,
      description: "Função client.getNumberId retornou null. Arquivo: VerifyNumber.ts"
    });
    return null;
  } catch (error) {
    await Log.create({
      name: 'VerifyNumber',
      message: `Erro 999999: Falha ao verificar número - ${cellphone}`,
      description: `Erro capturado: ${error.message}. Arquivo: VerifyNumber.ts`
    });
    return null;
  }
}

export { verifyNumber };
