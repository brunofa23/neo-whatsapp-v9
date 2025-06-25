import { ValidatePhone } from '../whatsapp-web/util'
import Log from 'App/Models/Log'

async function isClientReady(client) {
  try {
    const state = await client.getState();
    return state === 'CONNECTED' || state === 'READY';
  } catch (err) {
    return false;
  }
}

async function verifyNumber(client, cellphone) {

  const formattedPhone = await ValidatePhone(cellphone);
  if (!formattedPhone) {
    await Log.create({
      name: 'VerifyNumber',
      message: `Erro 12211: Número inválido ou não validado - ${cellphone}`,
      description: "Função validateAndFormatPhone falhou. Arquivo: VerifyNumber.ts"
    });
    return null;
  }

  // Verificar se o cliente está pronto antes de chamar getNumberId
  const ready = await isClientReady(client);
  if (!ready) {
    await Log.create({
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
    await Log.create({
      name: 'VerifyNumber',
      message: `Erro 568541: Número não identificado no WhatsApp - ${cellphone}`,
      description: "Função client.getNumberId retornou null. Arquivo: VerifyNumber.ts"
    });
    return null;
  } catch (error) {
    try {
      await Log.create({
        name: 'VerifyNumber',
        message: `Erro 999999: Falha ao verificar número - ${cellphone}`,
        description: `Erro capturado: ${error.message}. Arquivo: VerifyNumber.ts`
      });
    } catch (logError) {
      console.error('Erro ao gravar log do erro:', logError.message);
    }
    return 'repeat';
    // await Log.create({
    //   name: 'VerifyNumber',
    //   message: `Erro 999999: Falha ao verificar número - ${cellphone}`,
    //   description: `Erro capturado: ${error.message}. Arquivo: VerifyNumber.ts`
    // });
    // return 'repeat';
  }
}

export { verifyNumber };
