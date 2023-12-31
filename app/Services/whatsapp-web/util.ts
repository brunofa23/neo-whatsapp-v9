import { DateTime } from 'luxon';
import { Message } from 'whatsapp-web.js';
import Agent from 'App/Models/Agent';
import { startAgent } from "../../Services/whatsapp-web/whatsappConnection"

const fs = require('fs')


async function stateTyping(message: Message) {
  //console.log("passei pelo STATETYPING...")
  const chatTyping = await message.getChat();
  chatTyping.sendStateTyping();
  return await new Promise(resolve => setTimeout(resolve, 3000));
}

async function DateFormat(format, date = DateTime.local()) {

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
  const timeSchedule = (DateTime.local().hour > 5 && DateTime.local().hour < 24) ? true : false
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
  const positive = /(2|não|nao|cancelar|reagenda|desmarcar)/i;
  if (positive.test(stringResp)) {
    return true
  } else {
    return false
  }

}

async function InvalidResponse(stringResp) {

  //console.log("DENTRO DO INVALID RESPONSE>>", stringResp)
  const positive = /sim|não|1|2|pode confirmar|confirmada/ig;
  if (positive.test(stringResp)) {
    //console.log("RETORNOU TRUE")
    return true
  } else {
    //console.log("RETORNOU FALSE")
    return false
  }

}


async function RandomResponse(arrayResponse: String[]) {
  const index = Math.floor(Math.random() * arrayResponse.length)
  return arrayResponse[index]
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

async function validAgent() {
  console.log("Rodando valid agent...")
  await Agent.query().update({ statusconnected: false })
}






module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, PositiveResponse, NegativeResponse, ClearFolder, ValidatePhone, RandomResponse, InvalidResponse, validAgent }
