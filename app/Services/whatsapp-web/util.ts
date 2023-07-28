import { Message } from 'whatsapp-web.js';
import { DateTime } from 'luxon';
async function stateTyping(message: Message) {
  //console.log("passei pelo STATETYPING...")
  const chatTyping = await message.getChat();
  chatTyping.sendStateTyping();
  return await new Promise(resolve => setTimeout(resolve, 3000));
}

function dateFormat(format, date = DateTime.local()) {
  // Verificar se a data é válida
  //const formattedDate = dateFormat("dd/MM/yyyy HH:mm:ss");

  if (!(date instanceof DateTime)) {
    throw new Error('A data fornecida não é válida. Certifique-se de passar um objeto DateTime.');
  }

  // Formatando a data no formato especificado
  return date.toFormat(format);
}

module.exports = { stateTyping, dateFormat }
