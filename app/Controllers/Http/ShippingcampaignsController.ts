import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { executeWhatsapp } from '../../Services/whatsapp-web/whatsapp.ts'

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


}

