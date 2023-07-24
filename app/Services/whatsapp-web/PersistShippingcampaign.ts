import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'

import moment = require('moment');

export default async () => {

  const dataSource = new DatasourcesController
  const dataSourceList = await dataSource.scheduledPatients()

  for (const data of dataSourceList) {

    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const shipping = new Shippingcampaign()
    shipping.interaction_id = data.interaction_id
    shipping.interaction_seq = data.interaction_seq
    shipping.idexternal = data.idexternal
    shipping.reg = data.reg
    shipping.name = String(data.name).trim()
    shipping.cellphone = data.cellphone
    shipping.phonevalid = false
    shipping.messagesent = false
    shipping.message = String(data.message).replace(/@p[0-9]/g, '?')//`Olá ${firstName[0]}, somos da Neo, gostariamos de confirmar agendamento para o dia ${String(data.data_agm).trim()} com o Dr(a).${String(data.psv_nome).trim()} \n1-Sim \n2-Não `

    const verifyExist = await Shippingcampaign.query()
      .where('reg', '=', data.pac_reg)
      .andWhere('created_at', '>=', yesterday)
      .first()
    //console.log("query", verifyExist)
    if (!verifyExist) {
      //console.log("Adicionado>>>", verifyExist)
      await Shippingcampaign.create(shipping)
    }
  }


}




