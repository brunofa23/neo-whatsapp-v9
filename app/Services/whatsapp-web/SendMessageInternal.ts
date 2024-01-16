import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { Client } from "whatsapp-web.js"

import ListInternalPhrases from './ListInternalPhrases';
import { DateFormat, ExecutingSendMessage, GenerateRandomTime, stateTyping, TimeSchedule } from './util'

async function PhoneInternal() {
  const list_phone_talking = process.env.LIST_PHONES_TALK
  const list_phones = list_phone_talking?.split(",")
  if (list_phones?.length >= 0) {
    const phone = list_phones[Math.floor(Math.random() * list_phones?.length)]
    //console.log("List phones:", phone)
    return phone
  }
}

//*********************************** */
export default async (client: Client) => {

  async function sendMessages() {
    setInterval(async () => {

      if (await TimeSchedule() == false) {
        //console.log("Passei no Timeshecule>>>>")
        return
      }
      //const groupChat = client.getChatById('120363170786645695');
      //groupChat.sendMessage("teste......");
      const phrase = await ListInternalPhrases()
      const phone = await PhoneInternal()
      const validationCellPhone = await verifyNumber(client, phone)
      try {

        await client.sendMessage('120363170786645695@g.us', phrase)
          .then(async (response) => {
            //console.log("Mensagem enviada com sucesso!!", response)
          }).catch(async (error) => {
            //console.log("ERRRRO:::", error)
          })
      }
      catch (error) {
        console.log("ERRO:::", error)
      }
    }, await GenerateRandomTime(600, 900, '----Time Send Message'))//await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))
  }
  await sendMessages()

}



