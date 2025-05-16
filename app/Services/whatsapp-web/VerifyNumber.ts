//import { types } from '@ioc:Adonis/Core/Helpers'
import { ValidatePhone } from '../whatsapp-web/util'
import Log from 'App/Models/Log'

 async function verifyNumber(client, cellphone) {
  // if (!cellphone || types.isNull(cellphone) || cellphone == undefined || !ValidatePhone(cellphone) ) {
  //   await Log.create({
  //     name: 'VerifyNumber',
  //     message: `Erro 12211: Número inválido ou não validado - ${cellphone}`,
  //     description: "Função ValidatePhone falhou. Arquivo: VerifyNumber.ts"
  //   });
  //   return null;
  // }
  const formattedPhone = ValidatePhone(cellphone);
  if (!formattedPhone) {
    await Log.create({
      name: 'VerifyNumber',
      message: `Erro 12211: Número inválido ou não validado - ${cellphone}`,
      description: "Função validateAndFormatPhone falhou. Arquivo: VerifyNumber.ts"
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
    //return null;
  }
}

export { verifyNumber };
