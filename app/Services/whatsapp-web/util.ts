<<<<<<< HEAD
import Agent from 'App/Models/Agent';
=======
>>>>>>> development
import { DateTime } from 'luxon';
import { Message } from 'whatsapp-web.js';

const fs = require('fs')

async function stateTyping(message: Message) {
  //console.log("passei pelo STATETYPING...")
  const chatTyping = await message.getChat();
  chatTyping.sendStateTyping();
<<<<<<< HEAD
  return await new Promise(resolve => setTimeout(resolve, 2000));
=======
  return await new Promise(resolve => setTimeout(resolve, 3000));
>>>>>>> development
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
<<<<<<< HEAD
  //console.log(`GenerateRandomTime: ${randomTime}, min:${min}, max:${max}`)
=======
  //console.log(`Timer do método ${method}: ${randomTime}`)
>>>>>>> development
  return randomTime

}

<<<<<<< HEAD

async function TimeSchedule() {
  const now = DateTime.local().setZone('America/Sao_Paulo');

  const timeSchedule = (now.hour > 5 && now.hour < 21);
  const message = !timeSchedule ? `Fora do Horario de Envio 7 às 19: ${now.toFormat('dd/MM/yyyy HH:mm:ss')}` : undefined;

  if (message) console.log(message);
  return timeSchedule;
}


async function PositiveResponse(inputString: string): Promise<boolean> {
  const positiveResponses = [
    "1", "sim", "ok", "pode sim", "confirma", "com certeza",
    "afirmativo", "sim claro", "pode confirmar"
  ];
  // Normaliza o texto de entrada para evitar problemas com capitalização
  const normalizedInput = inputString.trim().toLowerCase();
  // Verifica se alguma das respostas positivas está contida no texto de entrada
  return positiveResponses.some(response => normalizedInput.includes(response));
}


async function NegativeResponse(stringResp: string): Promise<boolean> {
  const negativeResponses = [
    "2", "não", "nao", "cancelar", "reagenda", "desmarcar", "não pode",
    "não quero", "não consigo", "negativo", "nunca", "recusar"
  ];
  // Normaliza o texto de entrada para evitar problemas com capitalização
  const normalizedInput = stringResp.trim().toLowerCase();
  // Verifica se alguma das respostas negativas está contida no texto de entrada
  return negativeResponses.some(response => normalizedInput.includes(response));
}

=======
async function TimeSchedule() {
  const timeSchedule = (DateTime.local().hour > 5 && DateTime.local().hour < 20) ? true : false
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
>>>>>>> development


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


<<<<<<< HEAD
async function ValidatePhone(cellphone: string): string | null {
  if (!cellphone) return null;

  const digits = cellphone.replace(/\D/g, '');

  if (digits.length < 10) return null;

  let normalized = '';

  if (digits.length === 11) {
    // Ex: 31985228619 (DDD + 9 + número)
    normalized = '55' + digits;
  } else if (digits.length === 10) {
    // Ex: 3185228619 (DDD + número sem 9)
    // Adiciona o 9 depois do DDD para celular (considerando celular válido)
    normalized = '55' + digits.slice(0, 2) + '9' + digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith('55')) {
    normalized = digits;
  } else {
    return null; // formato não esperado
  }

  // Regex para validar:
  // - começa com 55
  // - DDD válido (01 a 99, não 00)
  // - número começa com 9
  // - número tem 9 dígitos após o DDD+9
  const celularRegex = /^55[1-9]{2}9\d{8}$/;
  if (!celularRegex.test(normalized)) return null;

  return normalized;
}



async function validAgent(agent) {
  console.log("Rodando valid agent...")
  await Agent.query()
    .where('id', agent.id)
    .update({ statusconnected: false })
}

async function chunckPhone(cellphone: string): Promise<string> {
  const match = cellphone.match(/(\d{8})@c\.us$/);
  if (match) {
    return match[1]; // Se casar com o padrão, retorna os 8 dígitos
  }
  // Caso não tenha '@c.us', retorna o número inteiro como está
  if (!cellphone.includes('@')) {
    return cellphone;
  }
  // Se tiver algo como '@g.us' ou outro sufixo, remove o que vem depois de '@'
  return cellphone.split('@')[0];
}

async function extractCellphone(mascara: string): string {
  return mascara.replace(/^55/, '').replace(/@.*/, '')
}


//RETORNA O DIA DA SEMANA PARA BUSCAR NO SISTEMA COM 2 DIAS
function getTargetDates(): DateTime[] {
  const today = DateTime.local().setZone('America/Sao_Paulo');
  const weekday = today.weekday; // 1 = segunda, ..., 7 = domingo
  let dates: DateTime[] = [];

  switch (weekday) {
    case 1: // Segunda → Quarta
      dates.push(today.plus({ days: 2 }));
      break;
    case 2: // Terça → Quinta
      dates.push(today.plus({ days: 2 }));
      break;
    case 3: // Quarta → Sexta
      dates.push(today.plus({ days: 2 }));
      break;
    case 4: // Quinta → Sábado
      dates.push(today.plus({ days: 2 }));
      break;
    case 5: // Sexta → Segunda
      dates.push(today.plus({ days: 3 }));
      break;
    case 6: // Sábado → Terça
      dates.push(today.plus({ days: 3 }));
      break;
    default:
      console.warn("Hoje é domingo, sem regra definida.");
      break;
  }

  return dates;
}

export {getTargetDates, stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, PositiveResponse, NegativeResponse, ClearFolder, ValidatePhone, RandomResponse, validAgent, chunckPhone, extractCellphone }
=======
async function ValidatePhone(cellphone) {
  // Expressão regular para validar o formato de um número de celular no Brasil
  const regexTelefoneCelular = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
  return regexTelefoneCelular.test(cellphone);
}


module.exports = { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, PositiveResponse, NegativeResponse, ClearFolder, ValidatePhone, RandomResponse, InvalidResponse }
>>>>>>> development
