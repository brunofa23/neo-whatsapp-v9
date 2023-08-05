import { DateTime } from 'luxon';
import { Message } from 'whatsapp-web.js';

async function stateTyping(message: Message) {
  //console.log("passei pelo STATETYPING...")
  const chatTyping = await message.getChat();
  chatTyping.sendStateTyping();
  return await new Promise(resolve => setTimeout(resolve, 3000));
}

async function DateFormat(format, date = DateTime.local()) {
  // Verificar se a data é válida
  //const formattedDate = dateFormat("dd/MM/yyyy HH:mm:ss");
  if (!(date instanceof DateTime)) {
    throw new Error('A data fornecida não é válida. Certifique-se de passar um objeto DateTime.');
  }
  // Formatando a data no formato especificado
  return date.toFormat(format);
}

async function GenerateRandomTime(min: number, max: number) {
  // Calcula um valor randômico entre 0 e 1
  const randomValue = Math.random();
  // Ajusta o valor randômico para o intervalo desejado
  const range = max - min;
  const scaledValue = randomValue * range;
  const shiftedValue = scaledValue + min;
  // Arredonda o valor para um número inteiro
  const finalValue = Math.round(shiftedValue) * 10;
  return finalValue;
}



module.exports = { stateTyping, DateFormat, GenerateRandomTime }
