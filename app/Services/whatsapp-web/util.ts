import { DateTime } from 'luxon';
import { Message } from 'whatsapp-web.js';

const fs = require('fs')

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

async function TimeSchedule() {
  const timeSchedule = (DateTime.local().hour > 7 && DateTime.local().hour < 20) ? true : false
  const message = !timeSchedule ? `Fora do Horario de Envio 7 às 19:${DateTime.local()}` : undefined
  if (message) console.log(message)
  return timeSchedule
}

async function PositiveResponse(inputString) {
  const regex = /(1|sim|ok|pode sim|confirma)/i;
  if (regex.test(inputString)) {
    return true
  } else {
    return false
  }

}

async function NegativeResponse(stringResp) {
  const positive = /(2|não|nao|cancelar|reagenda)/i;
  if (positive.test(stringResp)) {
    return true
  } else {
    return false
  }

}


async function RandomResponse(arrayResponse: String[]) {

  return Math.floor(Math.random() * arrayResponse.length)

}

async function ClearFolder(folderPath) {

  try {
    if (!fs.existsSync(folderPath)) {
      return
    }
    else {
      fs.unlink(`${folderPath}`, (err) => {
        if (err) {
          throw "ERRO DELETE::" + err;
        }
        console.log("Delete File successfully.");
        return true
      });
    }
  } catch (error) {

  }

}


async function ValidatePhone(cellphone) {
  // Expressão regular para validar o formato de um número de celular no Brasil
  const regexTelefoneCelular = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
  return regexTelefoneCelular.test(cellphone);
}


module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, PositiveResponse, NegativeResponse, ClearFolder, ValidatePhone, RandomResponse }
