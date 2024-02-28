import { types } from '@ioc:Adonis/Core/Helpers'
import { ValidatePhone } from '../whatsapp-web/util'
import Chat from 'App/Models/Chat'
import { DateTime } from 'luxon'

const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')
async function verifyNumber(client, cellphone) {

  if (await !ValidatePhone(cellphone))
    return null
  if (types.isNull(cellphone) || cellphone == undefined || !cellphone)
    return null

  try {
    const verifyClientSend = await Chat.query()
      .where('cellphone', cellphone)
      .andWhere('created_at', '>', dayBefore5)
      .andWhere('chatnumber', client.info.wid.user).first()

    if (verifyClientSend)
      return null

    const verifiedPhone = await client.getNumberId(cellphone)
    if (verifiedPhone) {
      //console.log("válido", verifiedPhone)
      return verifiedPhone._serialized
    }
    else {
      //console.log("inválido", verifiedPhone)
      return null
    }
  } catch (error) {
    return null
  }
}

module.exports = { verifyNumber }
