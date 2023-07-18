import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { sendRepeatedMessage } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'

import moment = require('moment');

async function sendRepeatedMessage() {
  //1 - Buscar os pacientes dos filtros selecionados
  const dataSource = new DatasourcesController
  const dataSourceList = await dataSource.scheduledPatients()

  //2 - Inserir na Tabela Shippingcampaign
  try {
    for (const data of dataSourceList) {
      const shipping = new Shippingcampaign()

      const firstName = String(data.pac_nome).trim().split(" ")
      shipping.reg = data.pac_reg
      shipping.name = String(data.pac_nome).trim()
      //shipping.appointmentdate = data.agm_hini
      shipping.cellphone = data.pac_celular
      shipping.message = `Olá ${firstName[0]}, somos da Neo, gostariamos de confirmar agendamento para o dia ${String(data.data_agm).trim()} com o Dr(a).${String(data.psv_nome).trim()} \n1-Sim \n2-Não `

      const verifyExist = await Shippingcampaign.query()
        .where('reg', '=', data.pac_reg).first()
      console.log("QUERYYYYYYY", verifyExist)
      if (!verifyExist) {
        console.log("Adicionado>>>", verifyExist)
        await Shippingcampaign.create(shipping)
      }
    }
  } catch (error) {
    console.log("erro no create", error)
  }

  //3 - Validar e filtrar os numeros válidos do Whatsapp verifyNumber
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const shippingCampaignList =
    await Shippingcampaign.query().whereNull('phonevalid')
      .andWhere('created_at', '>=', yesterday)
      .whereNull('messagesent')

  for (let dataRow of shippingCampaignList) {
    dataRow.cellphoneserialized = await verifyNumber(client, dataRow.cellphone)
    dataRow.phonevalid = (dataRow.cellphone == null || dataRow.cellphone == undefined) ? false : true
    dataRow.messagesent = false
    try {
      dataRow.save()
    } catch (error) {
      console.log("ERRO:", error)
    }

  }

  //4 - Enviar a mensagem...
  for (const dataRow of shippingCampaignList) {
    try {
      if (dataRow.phonevalid && !dataRow.messagesent) {
        //const send = client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
        dataRow.messagesent = true
        dataRow.save()
      }
    } catch (error) {
      console.log("ERRO:::", error)
    }
  }


  // const shipping = shippingCampaignList.map(shippingCampaign => {
  //   return {
  //     name: shippingCampaign.name,
  //     cellphone: shippingCampaign.cellphone,
  //     cellphoneserialized: shippingCampaign.cellphoneserialized,
  //     phonevalid: shippingCampaign.phonevalid,
  //     message: shippingCampaign.message,
  //     messagesent: shippingCampaign.messagesent
  //   }
  // })

  //  console.log("SHIPPING::", shipping)
  //  console.log("LISTA ENVIADA::", shippingCampaignList)


}
module.exports = { sendRepeatedMessage }




