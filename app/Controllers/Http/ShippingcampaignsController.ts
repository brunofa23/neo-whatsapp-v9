import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'

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

  public async store2() {
    const body = {
      name: 'Jose',
      gender: 'M',
      cellphone: '31222222',
      message: 'Olá tudo bemmmmmm'
    }
    const data = await Shippingcampaign.create(body)
    return data

  }

}




// export default class ShippingcampaignsController {

//   static get connection() {
//     return 'mssql2';
//   }
//   public async index({ response, request }) {

//     try {
//       const shippingCampaign = await Shippingcampaign.all()

//       return response.status(200).send(shippingCampaign)
//     } catch (error) {
//       return error
//       throw new BadRequest('Bad Request', 401, 'erro')
//     }

//   }

//   public async store({ response, request }) {

//     try {
//       const shippingCampaign = await Shippingcampaign
//         .query()

//       return response.status(200).send(shippingCampaign)
//     } catch (error) {
//       return error
//       throw new BadRequest('Bad Request', 401, 'erro')
//     }

//   }

//   public async store2() {
//     const body = {
//       name: 'Jose',
//       gender: 'M',
//       cellphone: '31222222',
//       message: 'Olá tudo bemmmmmm'
//     }
//     const data = await Shippingcampaign.create(body)
//     return data

//   }

// }
