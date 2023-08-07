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


async function GenerateRandomTime(min: number, max: number, method: String = "") {
  //console.log("VALORES MIN E MAX::", min, max)
  const _min = Math.ceil(min) * 1000
  const _max = Math.ceil(max) * 1000
  const randomTime = Math.floor(Math.random() * (_max - _min) + _min);
  //console.log(`Timer do método ${method}: ${randomTime}`)
  return randomTime

}



module.exports = { stateTyping, DateFormat, GenerateRandomTime }
