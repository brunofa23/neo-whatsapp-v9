import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { executeWhatsapp } from '../../Services/whatsapp-web/whatsapp.ts'
import Chat from 'App/Models/Chat'
import Database from '@ioc:Adonis/Lucid/Database'

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

  public async resetWhatsapp() {
    console.log("EXECUTANDO RESET ZAP")
    await executeWhatsapp(true)

  }

  public async chat({ response, request }) {

    //return "tester"
    const id = 567508
    const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}` //`update agm set agm_confirm_stat = 'C' where agm_id=:id`
    //const query = "select top 10 * from agm order by agm_hini desc"
    try {
      console.log("EXECUTANDO UPDATE NO SMART...", query)
      const result = await Database.connection('mssql').rawQuery(query)
      console.log("QUERY>>>", result)
      return result

    } catch (error) {
      return error
    }

    // try {
    //   const chat = await Chat.query()
    //     .preload('shippingcampaign').first()
    //   const jsonString = chat?.shippingcampaign.otherfields
    //   const jsonObject = JSON.parse(jsonString);
    //   console.log("CHAT CONTROLLER", jsonObject.address)

    //   // const chat = await Shippingcampaign.query()
    //   //   .preload('chat')

    //   return response.status(200).send(chat)
    // } catch (error) {
    //   return error
    //   //throw new BadRequest('Bad Request', 401, 'erro')
    // }

  }


}

