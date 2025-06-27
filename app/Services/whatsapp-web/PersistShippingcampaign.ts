import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { ValidatePhone } from '../whatsapp-web/util'
import { DateTime } from 'luxon';


function isIterable(obj) {
  try {
    return obj !== null && typeof obj[Symbol.iterator] === 'function';
  } catch (error) {
    return false
  }
}


export default async (date: string, prioritysend: boolean = false, interaction_id: number = 0, unit_cod: number = 0) => {
  //const dataSource = new DatasourcesController
  const dataSourceList = await new DatasourcesController().DataSource(date, interaction_id, unit_cod)
  const patientList: { reg: any, name: string, unit: string }[] = []


  if (!isIterable(dataSourceList)) {
    console.log("Algum erro ocorrido, não é iterable", dataSourceList)
    return
  }
  for (const data of dataSourceList) {

    try {
      const shipping = new Shippingcampaign()
      shipping.interaction_id = data.interaction_id
      shipping.interaction_seq = data.interaction_seq
      shipping.reg = data.reg
      shipping.dateshedule = data.agm_hini
      shipping.idexternal = data.idexternal
      shipping.name = String(data.name).trim()
      shipping.cellphone = String(data.cellphone).replace(/[^0-9]+/g, ''); //data.cellphone.replace("(", "").replace("-", "")
      if (!await ValidatePhone(data.cellphone))
        shipping.phonevalid = false
      shipping.messagesent = false
      shipping.message = String(data.message).replace(/@p[0-9]/g, '?')
      shipping.otherfields = data.otherfields
      shipping.doctor = String(data.doctor).trim()
      shipping.unit = String(data.unit).trim()
      shipping.unit_cod = String(data.unit_cod).trim()
      shipping.attendant = String(data.attendant).trim()
      shipping.covenant = ''
      shipping.dateservice = data.dateservice
      shipping.company_id = data.company_id
      shipping.phone_unit = data.phone_unit
      shipping.type_service = data.type_service
      shipping.prioritysend = prioritysend ? true : false


      const yesterday = DateTime.now()
        .setZone('America/Sao_Paulo')
        .minus({ days: 5 })
        .toFormat('yyyy-MM-dd');
      const verifyExist = await Shippingcampaign.query()
        .where('reg', '=', data.reg)
        .andWhere('created_at', '>=', yesterday)
        .andWhere('interaction_id', '=', data.interaction_id)
        .andWhere('phonevalid', true)
        .first()

      if (!verifyExist) {
        await Shippingcampaign.create(shipping)
        patientList.push({ reg: shipping.reg, name: shipping.name, unit: shipping.unit })
      }

    } catch (error) {
      console.log("Erro 44454>>>>", error)
    }

  }

  return patientList

}




