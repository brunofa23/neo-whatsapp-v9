import { Client } from "whatsapp-web.js"

import ListInternalPhrases from './ListInternalPhrases';
import { DateFormat, ExecutingSendMessage, GenerateRandomTime, stateTyping, TimeSchedule } from './util'

async function PhoneInternal() {
  const list_phone_talking = process.env.LIST_PHONES_TALK
  const list_phones = list_phone_talking?.split(",")
  if (list_phones?.length >= 0) {
    const phone = list_phones[Math.floor(Math.random() * list_phones?.length)]
    return phone
  }
}

//*********************************** */
export default async (client: Client) => {
  async function sendMessages() {
    if (await TimeSchedule() == false) {
      return
    }

    const phrase = await ListInternalPhrases()

    try {
      // Verifique se o cliente está conectado
      if (!client || !client.info || !client.info.wid) {
        console.log("Cliente do WhatsApp desconectado ou inválido.")
        return
      }

      // Opcional: verifique se o navegador ainda está rodando
      const pupBrowser = client?.pupBrowser
      if (pupBrowser && typeof pupBrowser.isConnected === 'function' && !pupBrowser.isConnected()) {
        console.log("Navegador do WhatsApp fechado.")
        return
      }

      await client.sendMessage('120363170786645695@g.us', phrase)
    } catch (error) {
      console.log("Erro ao enviar mensagem:", error.message)
    }
  }

  await sendMessages()
}



