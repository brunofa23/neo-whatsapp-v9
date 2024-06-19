import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Chat from 'App/Models/Chat';
import Customchat from 'App/Models/Customchat';
import { Client, MessageMedia } from 'whatsapp-web.js';
import MidiasController from 'App/Controllers/Http/MidiasController';
import { DateFormat, RandomResponse, stateTyping } from '../util'
import ConfirmSchedule from './ConfirmSchedule'
import ServiceEvaluation from './ServiceEvaluation';


async function verifyNumberInternal(phoneVerify: String) {
  const list_phone_talking = process.env.LIST_PHONES_TALK
  const list_phones = list_phone_talking?.split(",")
  if (list_phones) {
    for (const phone of list_phones) {
      //console.log("passei no verify internals", phoneVerify, "Listphones:", list_phones)
      if (phoneVerify === phone)
        return true
    }
  }

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
      client.on('message', async message => {
        let groupChat = await message.getChat();
        if (groupChat.isGroup) { return null }
        if (message.type.toLowerCase() == "e2e_notification") return null;
        if (message.body == "" && !message.hasMedia) return null;
        if (message.from.includes("@g.us")) return null;
        // console.log("GET CONTACT::::>>>>", await message.getContact())
        // console.log("GET INFO::::>>>>", await message.getInfo())
        // console.log("DEVICE TYPE::::>>>>", await message.deviceType)
        if (await verifyNumberInternal(message.from)) {
          console.log("Numero interno", message.from)
          return
        }

        const customChat = await getCustomChat(message.from, client.info.wid.user)
        let chat
        if (customChat) {

          let path_media: string | undefined = "";

          if (message.hasMedia) {
            //console.log("PASSEI DENTRO DA MIDIA......")
            const media = await message.downloadMedia();
            const midias = new MidiasController
            const fileName = `${customChat.chats_id}_${Date.now()}`
            path_media = await midias.storeMedia(media, fileName, "Customchats")
            message.body = " "
            // do something with the media data here
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
            path_media: path_media
          }
          //console.log("viewed 4444>>", bodyResponse)
          await Customchat.create(bodyResponse)
          //chamar gravação
          return
        } else {
          chat = await getChat(message.from, message.to)
        }

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

          else if (message.body === "destroy") {

            console.log("EXECUTANDO DISCONECT")
            console.log("mandei destruir...")
            // agent.status = 'Disconnected'
            // await agent.save()
            // Destroy and reinitialize the client when disconnected
            await client.destroy();
            console.log("DESTRUIDO...")

          }

          else if (message.body === 'PinChat') {
            console.log("CLIENTE", message)
          }

          else {

            const responseArray = [
              "Desculpe, mas esta conversa já foi finalizada. O Neo Agradece por sua compreensão, para maiores esclarecimentos ligue para 31-32350003.",
              "Infelizmente esta conversa já foi finalizada. O Neo Agradece por sua interação! Maiores esclarecimentos ligue para 31-32350003.",
              "Olá, sou apenas uma atendente virtual, para maiores esclarecimentos ligue para 31-32350003.",
              "Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi finalizada. Para maiores esclarecimentos ligue para 31-32350003. O Neo Agradece!"
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


  }


}

