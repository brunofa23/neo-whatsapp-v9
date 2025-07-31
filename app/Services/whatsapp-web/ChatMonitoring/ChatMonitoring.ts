<<<<<<< HEAD
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
=======
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Chat from 'App/Models/Chat';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import { SendMessage } from 'App/Services/whatsapp-web/SendMessage';
import { Client, MessageMedia } from 'whatsapp-web.js';

import { DateFormat, RandomResponse, stateTyping } from '../util'
import ConfirmSchedule from './ConfirmSchedule'
import ServiceEvaluation from './ServiceEvaluation';

async function verifyNumberInternal(phoneVerify: String) {
  const list_phone_talking = process.env.LIST_PHONES_TALK
  const list_phones = list_phone_talking?.split(",")

  for (const phone of list_phones) {
    console.log("passei no verify internals", phoneVerify, "Listphones:", list_phones)
    if (phoneVerify === phone)
      return true
  }


>>>>>>> development
}

export default class Monitoring {
  async monitoring(client: Client) {
    try {
<<<<<<< HEAD
      client.on('message', async (message) => {
        if (await shouldIgnoreMessage(message)) return;

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

        if (message.hasMedia) {
          await stateTyping(message)
          client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos apenas textos. Obrigada!')
          return
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
function shouldIgnoreMessage(message: Message): boolean {
  const isE2ENotification = message.type?.toLowerCase() === "e2e_notification";
  const isEmptyMessage = message.body === "" && !message.hasMedia;
  // Verificações baseadas no campo `from`
  const isGroupMessage = message.from?.includes("@g.us");
  const isBroadcastMessage = message.from?.includes("@broadcast");
  const isStatusMessage = message.from?.includes("@status");
  // Só queremos mensagens de pessoas (@c.us)
  const isNotFromIndividual = !message.from?.includes("@c.us");
  return isE2ENotification || isEmptyMessage || isGroupMessage || isBroadcastMessage || isStatusMessage || isNotFromIndividual;
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
=======
      client.on('message', async message => {

        let groupChat = await message.getChat();

        if (groupChat.isGroup) { return null }
        if (message.type.toLowerCase() == "e2e_notification") return null;
        if (message.body == "") return null;
        if (message.from.includes("@g.us")) return null;

        // console.log("GET CONTACT::::>>>>", await message.getContact())
        // console.log("GET INFO::::>>>>", await message.getInfo())
        // console.log("DEVICE TYPE::::>>>>", await message.deviceType)

        if (await verifyNumberInternal(message.from)) {
          console.log("Numero interno", message.from)
          return
        }

        const chat = await Chat.query()
          .preload('shippingcampaign')
          .where('cellphoneserialized', '=', message.from)
          .whereNull('response').first()

        if (chat && chat.returned == false) {
          chat.invalidresponse = message.body.slice(0, 348)
          chat.returned = true
          await chat.save()
        }
        if (chat) {
          global.contSend--
          if (chat.interaction_id == 1) {
            await ConfirmSchedule(client, message, chat)
            return
          }
          else
            if (chat.interaction_id == 2) {
              await ServiceEvaluation(client, message, chat)
              return
            }

        } else {
          if (message.body.toUpperCase() === 'OI' || message.body.toUpperCase() === 'OLÁ') {
            console.log("ENTREI NO OI...")
            await stateTyping(message)
            client.sendMessage(message.from, "Olá, sou a Iris, atendente virtual do Neo.")
            return
          }
          else if (message.body.startsWith("verificar")) {
            const string = message.body;
            const numbers = string.match(/\d/g).join("");
            await stateTyping(message)
            console.log("Resultado do telefone:", numbers)

            try {
              client.getNumberId(numbers).then((result) => {
                console.log('Number ID:', result);
                if (result)
                  client.sendMessage(message.from, `Número de Whatsapp validado: ${result?._serialized}`)
                if (!result || result._serialized === undefined)
                  client.sendMessage(message.from, `Número não identificado para o Whatsapp.`)
              }).catch((error) => {
                console.error('Failed to get number ID:', error);
              });
              //console.log("GET NUMBERID>>>", verifyNumber)
            } catch (error) {
              console.log("ERRO:::", error)
            }
            return
          }
          else if (message.body.toUpperCase() === "#PD") {//posição diária
            const pd = new ShippingcampaignsController()
            const result = await pd.dayPosition()
            const sendResponse = `*Total diário:* ${result.totalDiario}\n*Telefones válidos:* ${result.telefonesValidos}\n*Mensagens Enviadas:* ${result.mensagensEnviadas}\n*Mensagens Retornadas:* ${result.mensagensRetornadas}\n*Confirmações:* ${result.confirmacoes}\n*Reagendamentos:* ${result.reagendamentos}`
            await stateTyping(message)
            client.sendMessage(message.from, `*Posição diária até o momento:*`)
            client.sendMessage(message.from, sendResponse)


          }
          // else if (message.body === "destroy") {
          //   //client.destroy()
          //   client.logout()
          //     .then(() => {
          //       console.log('Conversa encerrada com sucesso.');
          //     })
          //     .catch((error) => {
          //       console.error('Erro ao encerrar a conversa:', error);
          //     });
          //   return
          // }

          else if (message.body === 'PinChat') {
            console.log("CLIENTE", message)
          }

          else {

            const responseArray = [
              "Desculpe, mas esta conversa já foi encerrada. O Neo Agradece por sua compreensão, maiores esclarecimentos ligue para 31-32350003.",
              "Infelizmente esta conversa já foi encerrada. O Neo Agradece por sua interação! Maiores esclarecimentos ligue para 31-32350003.",
              "Olá, sou apenas uma atendente virtual, para maiores esclarecimentos ligue para 31-32350003.",
              "Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi encerrada. Para maiores esclarecimentos ligue para 31-32350003. O Neo Agradece!"
            ]
            const messageRandom = await RandomResponse(responseArray)
            await stateTyping(message)
            await stateTyping(message)
            client.sendMessage(message.from, messageRandom)
            return

          }

        }

      });

    } catch (error) {

      console.log("ERRO>>>>", error)

    }


>>>>>>> development
  }


}
<<<<<<< HEAD
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







=======
>>>>>>> development

