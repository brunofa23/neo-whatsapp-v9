
import moment = require('moment');
import Shippingcampaign from 'App/Models/Shippingcampaign';
import { Client } from 'whatsapp-web.js';
import { verifyNumber } from './VerifyNumber'

export default async (client: Client) => {

  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
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
  return shippingCampaignList

}


