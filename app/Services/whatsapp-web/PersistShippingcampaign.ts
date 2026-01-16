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

      // ✅ usa ValidatePhone normalmente
      const normalized = await ValidatePhone(phone)

      // ✅ se for válido, marca phonevalid e já preenche o serialized
      if (normalized) {
        shipping.phonevalid = true
        // CAMPO NOVO: chave técnica para batida com webhook
        // ajuste o nome da propriedade se na model estiver diferente (ex: cellphoneserialized)
        shipping.cellphoneSerialized = normalized
      } else {
        shipping.phonevalid = null
        shipping.cellphoneSerialized = null
      }

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

      //shipping.gupshupParams = data.gupshup_params ?? null
      if (data.interaction_id == 1) {
        const firstName = String(data.name ?? "").trim().split(/\s+/)[0] || ""
        const firstNameDoctor = String(data.doctor ?? "").trim().split(/\s+/)[0] || ""
        const dateSchedule = DateTime.fromJSDate(data.agm_hini, { zone: "utc" }).toFormat("dd/MM/yyyy HH:mm");
        const gupParamsArr = [
          firstName,
          dateSchedule,
          shipping.unit,
          `Dr(a).${firstNameDoctor}`,
        ]
        shipping.gupshupParams = JSON.stringify(gupParamsArr) ?? null
      }
      if (data.interaction_id == 2) {
        const firstName = String(data.name ?? "").trim().split(/\s+/)[0] || ""
        const dateservice = DateTime.fromJSDate(data.dateservice, { zone: "utc" }).toFormat("dd/MM/yyyy");
        const gupParamsArr = [
          firstName,
          dateservice,
          shipping.unit,
        ]
        shipping.gupshupParams = JSON.stringify(gupParamsArr) ?? null
      }

      const verifyExist = await Shippingcampaign.query()
        .where('reg', data.reg)
        .andWhere('created_at', '>=', since)
        .andWhere('interaction_id', data.interaction_id)
        .first()

      // ✅ se já existe e não tinha gupshupParams, atualiza só os params
      if (
        verifyExist &&
        (verifyExist.gupshupParams == null || String(verifyExist.gupshupParams).trim() === '') &&
        shipping.gupshupParams
      ) {
        await Shippingcampaign
          .query()
          .where('id', verifyExist.id)
          .update({
            gupshupParams: shipping.gupshupParams,
            // opcional: se quiser ir “retroalimentando” o serialized em registros antigos
            // só se ainda não tiver
            ...(normalized && !verifyExist.cellphoneSerialized
              ? { cellphoneSerialized: normalized }
              : {}),
          })
      }

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
