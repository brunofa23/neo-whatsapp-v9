import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { executeWhatsapp } from '../../Services/whatsapp-web/whatsapp'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'

import { DateFormat } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'

export default class ShippingcampaignsController {

  static get connection() {
    return 'mssql2';
  }
  public async index({ response, request }) {
    try {
      const shippingCampaign = await Shippingcampaign.all()
      return response.status(200).send(shippingCampaign)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }
  }

  public async store({ response, request }) {
    try {
      const shippingCampaign = await Shippingcampaign
        .query()
      return response.status(200).send(shippingCampaign)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }

  }


  public async messagesSent() {
    try {
      const maxLimitSendMessage =
        await Shippingcampaign.query()
          .where('messagesent', '=', '1')

      return maxLimitSendMessage
    } catch (error) {
      return error

    }
  }


  public async maxLimitSendMessage() {
    const dateStart = await DateFormat("2023-08-01 00:00:00", DateTime.local())
    const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
    const countMessage = await Chat.query()
      .countDistinct('shippingcampaigns_id as tot')
      .where('chatname', '1')
      .whereBetween('created_at', [dateStart, dateEnd]).first()
    if (!countMessage || countMessage == undefined || countMessage == null)
      return 0
    return parseInt(countMessage.$extras.tot)

  }




  public async chat({ response, request }) {

    //return "tester"
    const id = 567508
    const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}` //`update agm set agm_confirm_stat = 'C' where agm_id=:id`
    //const query = "select top 10 * from agm order by agm_hini desc"
    try {
      console.log("EXECUTANDO UPDATE NO SMART...", query)
      //const result = await Database.connection('mssql').rawQuery(query)
      await Database.connection('mssql').rawQuery(query).then((result) => {
        return `executado com sucesso:: ${result}`
      }).catch((error) => {
        return `Error: ${error}`
      })

      //console.log("QUERY>>>", result)
      //return result

    } catch (error) {
      return error
    }


  }


}

