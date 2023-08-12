import { Shipping } from 'App/Controllers/Http/TestesController';
import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'

import moment = require('moment');
function isIterable(obj) {
  return obj !== null && typeof obj[Symbol.iterator] === 'function';
}


export default async () => {
  const dataSource = new DatasourcesController
  //const dataSourceList = await dataSource.scheduledPatients()
  const dataSourceList = await dataSource.DataSource()
  //console.log("DATA SOURCE>>>", dataSourceList)

  if (!isIterable(dataSourceList)) {
    console.log("Algum erro ocorrido, não é iterable", dataSourceList)
    return
  }
  //console.log("DADOS:::", dataSourceList)
  for (const data of dataSourceList) {

    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      const shipping = new Shippingcampaign()
      shipping.interaction_id = data.interaction_id
      shipping.interaction_seq = data.interaction_seq
      shipping.reg = data.reg
      shipping.idexternal = data.idexternal
      shipping.name = String(data.name).trim()
      shipping.cellphone = data.cellphone
      //shipping.phonevalid = false
      shipping.messagesent = false
      shipping.message = String(data.message).replace(/@p[0-9]/g, '?')
      shipping.otherfields = data.otherfields
      shipping.chatnameid = data.cellphone//'1'//String(process.env.CHAT_NAME)

      console.log("shipping....", shipping)

      const verifyExist = await Shippingcampaign.query()
        .where('reg', '=', data.reg)
        .andWhere('created_at', '>=', yesterday)
        .andWhere('interaction_id', '=', data.interaction_id)
        .first()
      //console.log("query", verifyExist)
      if (!verifyExist) {
        //console.log("Adicionado>>>", verifyExist)
        await Shippingcampaign.create(shipping)
      }

    } catch (error) {
      console.log("Erro 44454>>>>", error)

    }

  }


}




