import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import { Client } from "whatsapp-web.js"
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { GenerateRandomTime, DateFormat, TimeSchedule, ExecutingSendMessage, stateTyping } from './util'

import ListInternalPhrases from './ListInternalPhrases';

const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE)
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END)

async function PhoneInternal() {
  const list_phone_talking = process.env.LIST_PHONES_TALK
  const list_phones = list_phone_talking?.split(",")
  if (list_phones?.length >= 0) {
    const phone = list_phones[Math.floor(Math.random() * list_phones?.length)]
    console.log("List phones:", phone)
    return phone
  }
}

//*********************************** */
export default async (client: Client) => {

  async function sendMessages() {
    //setInterval(async () => {
    if (await TimeSchedule() == false) {
      return
    }
    const phrase = await ListInternalPhrases()
    const phone = await PhoneInternal()
    const validationCellPhone = await verifyNumber(client, phone)
    try {
      await client.sendMessage(validationCellPhone, phrase)
        .then(async (response) => {
          //console.log("Mensagem enviada com sucesso!!")
        }).catch(async (error) => {
          //console.log("ERRRRO:::", error)
        })
    }
    catch (error) {
      console.log("ERRO:::", error)
    }
    //}, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))
  }
  await sendMessages()

}



