import Agent from 'App/Models/Agent';
import { DateTime } from 'luxon';
import { Message } from 'whatsapp-web.js';

const fs = require('fs')

async function stateTyping(message: Message) {
  //console.log("passei pelo STATETYPING...")
  const chatTyping = await message.getChat();
  chatTyping.sendStateTyping();
  return await new Promise(resolve => setTimeout(resolve, 2000));
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
  //console.log(`GenerateRandomTime: ${randomTime}, min:${min}, max:${max}`)
  return randomTime

}

async function TimeSchedule() {
  const timeSchedule = (DateTime.local().hour > 5 && DateTime.local().hour < 21) ? true : false
  const message = !timeSchedule ? `Fora do Horario de Envio 7 às 19:${DateTime.local()}` : undefined
  if (message) console.log(message)
  return timeSchedule
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

// function ValidatePhone(cellphone: string): Promise<boolean> {
//   // Remove espaços e normaliza a entrada
//   const sanitizedCellphone = cellphone.trim();
//   // Expressão regular para validar números de celular brasileiros
//   const brazilianPhoneRegex = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
//   // Testa o número de telefone contra o regex
//   return brazilianPhoneRegex.test(sanitizedCellphone);
// }
function ValidatePhone(cellphone: string): string | null {
  if (!cellphone) return null;
  // Remove tudo que não for número
  const digits = cellphone.replace(/\D/g, '');

  // Ex: 911234567 (sem DDD) → inválido
  if (digits.length < 10) return null;

  // Adiciona +55 se não tiver (código do Brasil)
  let normalized = digits;

  if (digits.length === 11) {
    // Ex: 11912345678
    normalized = '55' + digits;
  } else if (digits.length === 13 && digits.startsWith('55')) {
    // já está no formato correto
  } else {
    // número não esperado

    return null;
  }
  // Validação básica: deve ter 13 dígitos e ser celular (começa com 9 após DDD)
  const celularRegex = /^55[1-9]{2}9[6-9]\d{7}$/;
  if (!celularRegex.test(normalized)) return null;
  return normalized; // exemplo: 5511912345678
}


async function validAgent(agent) {
  console.log("Rodando valid agent...")
  await Agent.query()
    .where('id', agent.id)
    .update({ statusconnected: false })
}


//Pega um pedaço do telefone para buscas
async function chunckPhone(cellphone:string) {
  const match = cellphone.match(/(\d{8})@c\.us$/); // Captura os últimos 8 números antes do "@c.us"
  return match ? match[1] : "";
}

export { stateTyping, DateFormat, GenerateRandomTime, TimeSchedule, PositiveResponse, NegativeResponse, ClearFolder, ValidatePhone, RandomResponse, validAgent, chunckPhone }
