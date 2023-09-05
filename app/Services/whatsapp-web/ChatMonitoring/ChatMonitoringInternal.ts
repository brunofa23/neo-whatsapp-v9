import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Chat from 'App/Models/Chat';
import { DateTime } from 'luxon';
import { Client } from 'whatsapp-web.js';

import ListInternalPhrases from '../ListInternalPhrases';
import { DateFormat, stateTyping } from '../util'

async function verifyNumberInternal(phoneVerify: String) {
  const list_phone_talking = process.env.LIST_PHONES_TALK
  const list_phones = list_phone_talking?.split(",")

  for (const phone of list_phones) {
    //console.log("passei no verify internals")
    if (phoneVerify === phone)
      return true
  }

}


let dateSendMessageInternalUpdate = DateTime.local()

function timeRandom(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default class Monitoring {
  async monitoring(client: Client) {

    try {
      client.on('message', async message => {

        if (await verifyNumberInternal(message.from)) {
          // console.log("INTERNAL")
          // console.log("DATA ATUAL:::::>>>>", await DateTime.now().toString())
          // console.log("DATA ATUALIZADA:::::>>>>", await dateSendMessageInternalUpdate.toString())

          if (dateSendMessageInternalUpdate <= DateTime.now()) {
            const time = await timeRandom(25000, 30000)
            //console.log("TIME", time)
            dateSendMessageInternalUpdate = await DateTime.local().plus({ seconds: time })
            const phrase = await ListInternalPhrases()
            await stateTyping(message)
            client.sendMessage(message.from, phrase)
            return
          }

          return
        }

      });

    } catch (error) {

      console.log("ERRO>>>>", error)

    }


  }


}

