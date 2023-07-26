import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { executeWhatsapp } from '../../Services/whatsapp-web/whatsapp.ts'
import Chat from 'App/Models/Chat'

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
    //return "Teste Chat"
    try {
      const chat = await Chat.query()
        .preload('shippingcampaign').first()
      const jsonString = chat?.shippingcampaign.otherfields
      const jsonObject = JSON.parse(jsonString);
      console.log("CHAT CONTROLLER", jsonObject.address)

      // const chat = await Shippingcampaign.query()
      //   .preload('chat')

      return response.status(200).send(chat)
    } catch (error) {
      return error
      //throw new BadRequest('Bad Request', 401, 'erro')
    }

  }


}

