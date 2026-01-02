import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { ValidatePhone } from './util'
import { DateTime } from 'luxon';


function isIterable(obj) {
  try {
    return obj !== null && typeof obj[Symbol.iterator] === 'function';
  } catch (error) {
    return false
  }
}


// export default async (date: string, prioritysend: boolean = false, interaction_id: number = 0, unit_cod: number = 0) => {

//   const dataSourceList = await new DatasourcesController().DataSource(date, interaction_id, unit_cod)
//   const patientList: { reg: any, name: string, unit: string }[] = []


//   if (!isIterable(dataSourceList)) {
//     console.log("Algum erro ocorrido, não é iterable", dataSourceList)
//     return
//   }
//   for (const data of dataSourceList) {

//     console.log("@@@@@@@@@>>>>>", data)

//     try {
//       const shipping = new Shippingcampaign()
//       shipping.interaction_id = data.interaction_id
//       shipping.interaction_seq = data.interaction_seq
//       shipping.reg = data.reg
//       shipping.dateshedule = data.agm_hini
//       shipping.idexternal = data.idexternal
//       shipping.name = String(data.name).trim()
//       shipping.cellphone = String(data.cellphone).replace(/[^0-9]+/g, ''); //data.cellphone.replace("(", "").replace("-", "")
//       if (!await ValidatePhone(data.cellphone))
//         shipping.phonevalid = false
//       shipping.messagesent = false
//       shipping.message = String(data.message).replace(/@p[0-9]/g, '?')
//       shipping.otherfields = data.otherfields
//       shipping.doctor = String(data.doctor).trim()
//       shipping.unit = String(data.unit).trim()
//       shipping.unit_cod = String(data.unit_cod).trim()
//       shipping.attendant = String(data.attendant).trim()
//       shipping.covenant = ''
//       shipping.dateservice = data.dateservice
//       shipping.company_id = data.company_id
//       shipping.phone_unit = data.phone_unit
//       shipping.type_service = data.type_service
//       shipping.prioritysend = prioritysend ? true : false
//       shipping.file_path = data.file_path
//       shipping.gupshupParams = data.gupshup_params


//       const yesterday = DateTime.now()
//         .setZone('America/Sao_Paulo')
//         .minus({ days: 5 })
//         .toFormat('yyyy-MM-dd');
//       const verifyExist = await Shippingcampaign.query()
//         .where('reg', '=', data.reg)
//         .andWhere('created_at', '>=', yesterday)
//         .andWhere('interaction_id', '=', data.interaction_id)
//         //.andWhere('phonevalid', true)
//         .first()

//       if (!verifyExist) {
//         //console.log(">>>>>>>1222:",shipping)
//         await Shippingcampaign.create(shipping)
//         patientList.push({ reg: shipping.reg, name: shipping.name, unit: shipping.unit })
//       }

//     } catch (error) {
//       console.log("Erro 44454>>>>", error)
//     }

//   }

//   return patientList

// }

export default async (date: string, prioritysend: boolean = false, interaction_id: number = 0, unit_cod: number = 0) => {
  if (!date || typeof date !== 'string') return []

  const asText = (v: any) => (v == null ? '' : String(v)).trim()
  const onlyDigits = (v: any) => asText(v).replace(/\D+/g, '')

  const dataSourceList = await new DatasourcesController().DataSource(date, interaction_id, unit_cod)
  const patientList: { reg: any, name: string, unit: string }[] = []

  if (!isIterable(dataSourceList)) {
    console.log("Algum erro ocorrido, não é iterable", typeof dataSourceList)
    return []
  }

  const since = DateTime.now()
    .setZone('America/Sao_Paulo')
    .minus({ days: 5 })
    .startOf('day')
    .toJSDate()

  for (const data of dataSourceList) {
    try {
      if (!data?.reg || !data?.interaction_id) continue

      const shipping = new Shippingcampaign()
      shipping.interaction_id = data.interaction_id
      shipping.interaction_seq = data.interaction_seq
      shipping.reg = data.reg
      shipping.dateshedule = data.agm_hini
      shipping.idexternal = data.idexternal

      shipping.name = asText(data.name)

      const phone = onlyDigits(data.cellphone)
      shipping.cellphone = phone
      shipping.phonevalid = await ValidatePhone(phone)

      shipping.messagesent = false
      shipping.message = asText(data.message).replace(/@p[0-9]/g, '?')

      shipping.otherfields = data.otherfields ?? null
      shipping.doctor = asText(data.doctor)
      shipping.unit = asText(data.unit)
      shipping.unit_cod = asText(data.unit_cod)
      shipping.attendant = asText(data.attendant)

      shipping.covenant = ''
      shipping.dateservice = data.dateservice
      shipping.company_id = data.company_id
      shipping.phone_unit = data.phone_unit
      shipping.type_service = data.type_service
      shipping.prioritysend = !!prioritysend
      shipping.file_path = data.file_path ?? null
      shipping.gupshupParams = data.gupshup_params ?? null

      const verifyExist = await Shippingcampaign.query()
        .where('reg', data.reg)
        .andWhere('created_at', '>=', since)
        .andWhere('interaction_id', data.interaction_id)
        .first()

      if (!verifyExist) {
        await Shippingcampaign.create(shipping)
        patientList.push({ reg: shipping.reg, name: shipping.name, unit: shipping.unit })
      }
    } catch (error) {
      console.log("Erro ao criar Shippingcampaign", { reg: data?.reg, interaction_id: data?.interaction_id }, error)
    }
  }

  return patientList
}




