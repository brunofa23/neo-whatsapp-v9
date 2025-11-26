import Chat from 'App/Models/Chat';
import Response from 'App/Models/Response';
import Customchat from 'App/Models/Customchat';
import { Client, MessageMedia, Message } from 'whatsapp-web.js';
import MidiasController from 'App/Controllers/Http/MidiasController';
import { chunckPhone, RandomResponse, stateTyping } from '../util'
import ConfirmSchedule from './ConfirmSchedule'
import ServiceEvaluation from './ServiceEvaluation';
import Agent from 'App/Models/Agent';
import { DateTime } from 'luxon';
import { responderPergunta } from 'App/Services/Ai/aiResponder'
import Shippingcampaign from 'App/Models/Shippingcampaign';
import Talk from 'App/Models/Talk';


// Mapa global para rastrear mensagens por número e prevenir loops
const messageTracker = new Map<string, { count: number, lastMessage: number }>();
function isBotLoopDetected(phone: string): boolean {

  const now = Date.now();
  const record = messageTracker.get(phone);

  if (!record) {
    messageTracker.set(phone, { count: 1, lastMessage: now });
    return false;
  }
  const diff = now - record.lastMessage;
  if (diff < 5000) {
    record.count++;
    record.lastMessage = now;
    if (record.count >= 3) {
      console.warn(`Possível loop de bot detectado com ${phone}. Ignorando temporariamente.`);
      return true;
    }
  } else {
    messageTracker.set(phone, { count: 1, lastMessage: now });
  }

  return false;
}



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
  const query = Customchat.query()
    .where('cellphoneserialized', cellphone)
    .andWhere('chatnumber', chatnumber)
    .andWhereNull('returned')
    .orderBy('created_at', 'desc')
  //.first()
  const customChat = await query.first()
  return customChat
}

async function getChat(cellphone: String, agentPhone: String) {
  const match = agentPhone.match(/\d/g);
  const phoneAgent = match ? match.join('') : '';

  return await Chat.query()
    .preload('shippingcampaign')
    .where('cellphoneserialized', cellphone)
    .andWhere('chatnumber', phoneAgent)
    //.andWhere('returned', false).first()
    .orderBy('created_at', 'desc')
    .whereNull('response').first()
}



export default class Monitoring {
  // async monitoring(client: Client) {
  //   try {
  //     client.on('message', async (message) => {
  //       const phoneReturn = await resolveSender(client, message)

  //       if (await shouldIgnoreMessage(message)) return;


  //       // 🚫 Verifica se está em loop de mensagens
  //       if (isBotLoopDetected(message.from)) {
  //         console.log(`Loop detectado de ${message.from}, ignorando resposta.`);
  //         return;
  //       }

  //       console.log("PASSO 1******")
  //       const isInternalNumber = await verifyNumberInternal(message.from);
  //       if (isInternalNumber) {
  //         console.log("Número interno:", message.from);
  //         return;
  //       }

  //       console.log("PASSO 2******")
  //       if (message.hasMedia) {
  //         await stateTyping(message)
  //         client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!')
  //         return
  //       }

  //       console.log("PASSO 3******")
  //       const customChat = await getCustomChat(message.from, client.info.wid.user);
  //       if (customChat) {
  //         await handleCustomChatMessage(message, customChat);
  //         return;
  //       }


  //       console.log("PASSO 4 $$$$$$******", "de", teste.phoneJid,"-para", message.to)
  //       //const chat = await getChat(message.from, message.to);
  //       const chat = await getChat(phoneReturn.phoneJid, message.to);

  //       if (chat) {
  //         await handleChatMessage(client, message, chat);
  //         return;
  //       }

  //       await handleNewMessage(client, message);
  //     });
  //   } catch (error) {
  //     console.error("Erro no monitoramento:", error);
  //   }
  // }

  async monitoring(client: Client) {
    try {
      client.on('message', async (message) => {
        // 1) Resolve telefone quando possível (se vier @lid, tenta obter @c.us)
        const phoneReturn = await resolveSender(client, message);

        // ✅ Defina um "from" que será usado no resto do fluxo:
        // - se conseguiu phoneJid (ex: 5531...@c.us), usa ele
        // - senão, usa o original (ex: 1292...@lid)
        const fromResolved = phoneReturn?.phoneJid || message.from;

        // 2) Ignore messages (use fromResolved só se você usar isso dentro dos checks)
        if (await shouldIgnoreMessage(message)) return;

        // 🚫 Verifica se está em loop de mensagens
        if (isBotLoopDetected(fromResolved)) {
          console.log(`Loop detectado de ${fromResolved}, ignorando resposta.`);
          return;
        }

        const isInternalNumber = await verifyNumberInternal(fromResolved);
        if (isInternalNumber) {
          console.log("Número interno:", fromResolved);
          return;
        }

        if (message.hasMedia) {
          await stateTyping(message);
          await client.sendMessage(fromResolved, 'Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!');
          return;
        }

        const customChat = await getCustomChat(fromResolved, client.info.wid.user);
        if (customChat) {
          await handleCustomChatMessage(message, customChat);
          return;
        }

        // 3) getChat: só usa @c.us se existir; senão cai no message.from (lid)
        const chat = await getChat(fromResolved, message.to);

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

//Verifica e tenta decodificar o whatsapp
async function resolveSender(client, message) {
  const from = message.from;

  // Se já for número normal
  if (from.endsWith("@c.us")) {
    return {
      from,
      phoneJid: from,
      phone: from.replace("@c.us", ""),
    };
  }

  // Se for LID
  if (from.endsWith("@lid")) {
    try {
      const result = await client.getContactLidAndPhone([from]); // <-- aqui é o segredo
      const item = result?.[0];

      const pn = item?.pn || null; // ex: "5531...@c.us" (quando existir)
      return {
        from,
        lidJid: item?.lid || from,
        phoneJid: pn,
        phone: pn ? pn.replace("@c.us", "") : null,
      };
    } catch (err) {
      // Não derruba o processo se o WA Web não permitir resolver
      return {
        from,
        lidJid: from,
        phoneJid: null,
        phone: null,
        error: String(err),
      };
    }
  }

  // Outros casos
  return { from, phoneJid: null, phone: null };
}




// Verifica se a mensagem deve ser ignorada FILTRADA
function shouldIgnoreMessage(message: Message): boolean {
  const from = message.from ?? "";
  return (
    message.type?.toLowerCase() === "e2e_notification" ||
    (message.body === "" && !message.hasMedia) ||
    from.includes("@g.us") ||
    from.includes("@broadcast") ||
    from.includes("@status")
  );
}


// Processa mensagens personalizadas
async function handleCustomChatMessage(message: Message, customChat: any) {
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
  await Talk.create({
    chat_id: customChat.chats_id,
    reg: customChat.reg,
    cellphone: message.from,
    chatnumber: message.to,
    message_ack: message.ack,
    message: message.body.slice(0, 999),
    type: "from"
  });
}

// Processa mensagens de chat existentes
async function handleChatMessage(client: Client, message: Message, chat: any) {
  await Talk.create({
    chat_id: chat.id,
    reg: chat.reg,
    cellphone: message.from,
    chatnumber: message.to,
    message_ack: message.ack,
    message: message.body.slice(0, 999),
    type: "from"
  });


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
async function handleNewMessage(client: Client, message: Message) {
  //AI EM AÇÃO *******************************************************
  try {
    await Talk.create({
      cellphone: message.from,
      chatnumber: message.to,
      message_ack: message.ack,
      message: message.body.slice(0, 999),
      type: "from"
    });

    const query = await Shippingcampaign.query()
      //.where('cellphone', 'like', `%${await chunckPhone(message.from)}%`)
      .where('cellphoneserialized', message.from)
      .where('interaction_id', 1)
      .select('otherfields', 'name');

    const queryTalk = await Talk.query()
      .where('cellphone', message.from)
      .andWhere('chatnumber', message.to);

    const context = query.map((item) => `name:${item.name} \n${item.otherfields}`).join("\n");
    const contextTalk = queryTalk.map((item) => item.message).join("\n");
    const fullContext = context + '\n\n' + contextTalk;

    const response = await responderPergunta(message.body, fullContext);

    if (response) {
      await stateTyping(message);
      await client.sendMessage(message.from, response);
      await Talk.create({
        cellphone: message.from,
        chatnumber: message.to,
        message_ack: message.ack,
        message: response.slice(0, 999),
        type: "to"
      });
    } else {
      await sendRandomFinalMessage(client, message);
    }

  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    await client.sendMessage(message.from, "Desculpe, ocorreu um erro ao processar sua mensagem.");
  }


}
//********************************************************************
// Envia mensagem final aleatória
async function sendRandomFinalMessage(client: Client, message: Message) {
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








