import Chat from 'App/Models/Chat';
import Response from 'App/Models/Response';
import Customchat from 'App/Models/Customchat';
import { Client, MessageMedia } from 'whatsapp-web.js';
import MidiasController from 'App/Controllers/Http/MidiasController';
import { chunckPhone, RandomResponse, stateTyping } from '../util'
import ConfirmSchedule from './ConfirmSchedule'
import ServiceEvaluation from './ServiceEvaluation';
import Agent from 'App/Models/Agent';
import { DateTime } from 'luxon';
import { responderPergunta } from 'App/Services/Ai/aiResponder'
import Shippingcampaign from 'App/Models/Shippingcampaign';
import Talk from 'App/Models/Talk';

async function verifyNumberInternal(phoneVerify: string): Promise<boolean> {
  // Lista de telefones em formato de array
  const listPhonesFromEnv = process.env.LIST_PHONES_TALK?.split(",") || [];
  // Verifica se o telefone está na lista do ambiente
  if (listPhonesFromEnv.includes(phoneVerify)) {
    return true;
  }
  // Busca números de telefone dos agentes conectados
  const connectedAgents = await Agent.query()
    .select('number_phone')
    .whereNull('deleted')
    .andWhere('status', 'CONNECTED');
  // Verifica se o telefone está na lista de agentes
  const isPhoneInAgents = connectedAgents.some(agent => agent.number_phone === phoneVerify);

  return isPhoneInAgents;
}

async function getCustomChat(cellphone: String, chatnumber: String) {
  chatnumber = chatnumber.replace(/@.*$/, '');
  const customChat = await Customchat.query()
    .where('cellphoneserialized', cellphone)
    .andWhere('chatnumber', chatnumber)
    .andWhereNull('returned')
    .orderBy('created_at', 'desc')
    .first()
  return customChat
}

async function getChat(cellphone: String, agentPhone: String) {
  const phoneAgent = agentPhone.match(/\d/g).join("");

  return await Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', cellphone)
    .andWhere('chatnumber', phoneAgent)
    //.andWhere('returned', false).first()
    .whereNull('response').first()
}

export default class Monitoring {
  async monitoring(client: Client) {
    try {
      client.on('message', async (message) => {
        if (await shouldIgnoreMessage(message)) return;

        if (message.hasMedia) {
          await stateTyping(message)
          client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!')
          return
        }

        const isInternalNumber = await verifyNumberInternal(message.from);
        if (isInternalNumber) {
          console.log("Número interno:", message.from);
          return;
        }

        const customChat = await getCustomChat(message.from, client.info.wid.user);
        if (customChat) {
          await handleCustomChatMessage(message, customChat);
          return;
        }

        const chat = await getChat(message.from, message.to);
        if (chat) {
          await handleChatMessage(client, message, chat);
          return;
        }

        await handleNewMessage(client, message);
      });
    } catch (error) {
      console.error("Erro no monitoramento:", error);
    }
  }
}
// Verifica se a mensagem deve ser ignorada
async function shouldIgnoreMessage(message: any): Promise<boolean> {
  const isGroup = (await message.getChat()).isGroup;
  const isE2ENotification = message.type.toLowerCase() === "e2e_notification";
  const isEmptyMessage = message.body === "" && !message.hasMedia;
  const isGroupMessage = message.from.includes("@g.us");

  return isGroup || isE2ENotification || isEmptyMessage || isGroupMessage;
}

// Processa mensagens personalizadas
async function handleCustomChatMessage(message: any, customChat: any) {
  let pathMedia: string | undefined = "";
  if (message.hasMedia) {
    const media = await message.downloadMedia();
    const midias = new MidiasController();
    const fileName = `${customChat.chats_id}_${Date.now()}`;
    pathMedia = await midias.storeMedia(media, fileName, "Customchats");
    message.body = " ";
  }

  const bodyResponse = {
    chats_id: customChat.chats_id,
    reg: customChat.reg,
    cellphone: customChat.cellphone,
    cellphoneserialized: customChat.cellphoneserialized,
    chatnumber: customChat.chatnumber,
    returned: true,
    viewed: false,
    response: message.body,
    path_media: pathMedia,
  };

  await Customchat.create(bodyResponse);
  await Chat.query().where('id', customChat.chats_id).update({ date_return: DateTime.now().toFormat("yyyy-MM-dd HH:mm"), last_response: 2 })
}

// Processa mensagens de chat existentes
async function handleChatMessage(client: Client, message: any, chat: any) {
  if (!chat.returned) {
    chat.invalidresponse = message.body.slice(0, 348);
    chat.returned = true;
    await chat.save();
  }

  global.contSend--;
  if (chat.interaction_id === 1) {
    await ConfirmSchedule(client, message, chat);
  } else if (chat.interaction_id === 2) {
    await ServiceEvaluation(client, message, chat);
  }
}

// Processa mensagens novas
async function handleNewMessage(client: Client, message: any) {
  //const upperBody = message.body.toUpperCase();

  // if (upperBody === "OI" || upperBody === "OLÁ") {
  //   await stateTyping(message);
  //   client.sendMessage(message.from, "Olá, sou a Iris, uma atendente virtual.");
  //   return;
  // }

  // if (upperBody.startsWith("VERIFICAR")) {
  //   await handleVerification(client, message);
  //   return;
  // }

  //AI EM AÇÃO *******************************************************
  //const response = await AutomaticResponses(message.body);
  console.log(message.from)
  //insere a conversa na tabela
  await Talk.create({ cellphone: message.from, chatnumber: message.to, message: message.body, type: "from" })
  const query = await Shippingcampaign.query()
    .where('cellphone', 'like', `%${await chunckPhone(message.from)}%`)
    .where('interaction_id', 1).select('otherfields')

  const queryTalk = await Talk.query()
    .where('cellphone', message.from)
    .andWhere('chatnumber', message.to)

  const context = query.map((item) => item.otherfields).join("\n")
  const contextTalk = queryTalk.map((item) => item.message).join("\n")
  const fullContext = context + '\n\n' + contextTalk

  const response = await responderPergunta(message.body, fullContext)

  if (response) {
    await stateTyping(message);
    client.sendMessage(message.from, response);
    await Talk.create({ cellphone: message.from, chatnumber: message.to, message: response, type: "to" })
  } else {
    await sendRandomFinalMessage(client, message);
  }
}
//********************************************************************

// Processa mensagens de verificação
async function handleVerification(client: Client, message: any) {
  const numbers = message.body.match(/\d/g)?.join("") || "";
  await stateTyping(message);

  try {
    const result = await client.getNumberId(numbers);
    const responseMessage = result
      ? `Número de Whatsapp validado: ${result._serialized}`
      : "Número não identificado para o Whatsapp.";
    client.sendMessage(message.from, responseMessage);
  } catch (error) {
    console.error("Erro ao verificar número:", error);
  }
}

// Envia mensagem final aleatória
async function sendRandomFinalMessage(client: Client, message: any) {
  let responseArray: String[]
  const responsesChatfinish = await Response.query().select('message')
    .where('local', 'chatfinish')
  if (responsesChatfinish.length > 0)
    responseArray = responsesChatfinish.map(response => response.message)
  else
    responseArray = [
      "Desculpe, mas esta conversa já foi finalizada. O Neo Agradece por sua compreensão, para maiores esclarecimentos ligue para 31-32350003.",
      "Infelizmente esta conversa já foi finalizada. O Neo Agradece por sua interação! Maiores esclarecimentos ligue para 31-32350003.",
      "Olá, sou apenas uma atendente virtual, para maiores esclarecimentos ligue para 31-32350003.",
      "Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi finalizada. Para maiores esclarecimentos ligue para 31-32350003. O Neo Agradece!",
    ];
  const randomMessage = await RandomResponse(responseArray);
  await stateTyping(message);
  client.sendMessage(message.from, randomMessage);
}

// async function AutomaticResponses(message: String) {
//   // Separando a frase em palavras individuais
//   const words = message.toLowerCase().split(/\s+/); // Dividindo a frase em palavras e convertendo para minúsculas
//   // Inicializando a consulta
//   let query = Response.query();
//   words.forEach((word, index) => {
//     if (index === 0) {
//       // Para a primeira palavra, utilizamos where
//       if (word)
//         query = query.where('local', 'like', `%${word}%`);
//     } else {
//       // Para as palavras subsequentes, utilizamos orWhere
//       query = query.orWhere('local', 'like', `%${word}%`);
//     }
//   });
//   const response = await query.first();
//   return response?.message

// }







