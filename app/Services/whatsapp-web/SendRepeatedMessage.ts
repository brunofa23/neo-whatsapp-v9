import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Chat from 'App/Models/Chat';
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { Client } from 'whatsapp-web.js';

//import { verifyNumber } from 'App/Services/whatsapp-web/SendRepeatedMessage';

import { verifyNumber } from '../../Services/whatsapp-web/VerifyNumber'

import moment = require('moment');

async function sendRepeatedMessage(client: Client) {

  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  //1 - Buscar os pacientes dos filtros selecionados
  const dataSource = new DatasourcesController
  const dataSourceList = await dataSource.scheduledPatients()
  const chat = new Chat


  //2 - Inserir na Tabela Shippingcampaign
  try {
    for (const data of dataSourceList) {
      const shipping = new Shippingcampaign()

      shipping.interaction = data.interaction
      shipping.reg = data.pac_reg
      shipping.name = String(data.pac_nome).trim()
      shipping.cellphone = data.pac_celular
      shipping.phonevalid = false
      shipping.messagesent = false
      shipping.message = String(data.message).replace('@p0', '?').replace('@p1', '?') //`Olá ${firstName[0]}, somos da Neo, gostariamos de confirmar agendamento para o dia ${String(data.data_agm).trim()} com o Dr(a).${String(data.psv_nome).trim()} \n1-Sim \n2-Não `

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
  } catch (error) {
    console.log("erro no create", error)
  }

  //  3 - Validar e filtrar os numeros válidos do Whatsapp verifyNumber
  const shippingCampaignList =
    await Shippingcampaign.query().whereNull('phonevalid')
      .andWhere('created_at', '>=', yesterday)
      .whereNull('messagesent')
      .orWhere('messagesent', '=', 0)

  for (let dataRow of shippingCampaignList) {
    dataRow.cellphoneserialized = await verifyNumber(client, dataRow.cellphone)
    dataRow.messagesent = false
    if (dataRow.cellphoneserialized) {
      dataRow.phonevalid = true
    }
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
        //const send = await client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
        await client.sendMessage(dataRow.cellphoneserialized, dataRow.message)
          .then((response) => {
            console.log("SEND......", response)
            dataRow.messagesent = true
            dataRow.save()
          }).catch((error) => {
            console.log("ERRRRO:::", error)
          })

        const bodyChat = {
          interaction: dataRow.interaction,
          name: dataRow.name,
          cellphone: dataRow.cellphone,
          cellphoneserialized: dataRow.cellphoneserialized,
          message: dataRow.message,
          shippingcampaigns_id: dataRow.id
        }
        //console.log("CHAT", bodyChat)
        console.log("PASSEI AQUI 5", bodyChat)
        await Chat.create(bodyChat)

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
  //console.log("LISTA ENVIADA::", shipping)


}
module.exports = { sendRepeatedMessage }




