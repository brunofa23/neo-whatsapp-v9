import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { ValidatePhone } from './util'
import { DateTime } from 'luxon'
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'

function isIterable(obj) {
  try {
    return obj !== null && typeof obj[Symbol.iterator] === 'function'
  } catch (error) {
    return false
  }
}

export default async (
  date: string,
  prioritysend: boolean = false,
  interaction_id: number = 0,
  unit_cod: number = 0
) => {
  if (!date || typeof date !== 'string') return []

  const asText = (v: any) => (v == null ? '' : String(v)).trim()
  const onlyDigits = (v: any) => asText(v).replace(/\D+/g, '')

  const dataSourceList = await new DatasourcesController().DataSource(date, interaction_id, unit_cod)
  const patientList: { reg: any; name: string; unit: string }[] = []

  if (!isIterable(dataSourceList)) {
    console.log('Algum erro ocorrido, não é iterable', typeof dataSourceList)
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

      // ✅ CHAVE TÉCNICA (sempre): usada pra bater com o webhook
      shipping.cellphoneserialized = phone ? normalizePhoneKey(phone) : null

      // ✅ validação telefone
      const normalized = await ValidatePhone(phone)

      if (normalized) {
        shipping.phonevalid = true
      } else {
        shipping.phonevalid = null
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
      shipping.gupshupParams = data.gupshupParams ?? null

      const verifyExist = await Shippingcampaign.query()
        .where('reg', data.reg)
        .andWhere('created_at', '>=', since)
        .andWhere('interaction_id', data.interaction_id)
        .first()

      const phoneKey = phone ? normalizePhoneKey(phone) : null

      // 🔹 BLOCO 1: atualizar phonevalid e cellphoneserialized SEMPRE que já existir registro
      if (verifyExist) {
        const updatePhonePayload: any = {}

        // atualiza phonevalid se mudou ou se não tinha
        if (shipping.phonevalid !== undefined && shipping.phonevalid !== verifyExist.phonevalid) {
          updatePhonePayload.phonevalid = shipping.phonevalid
        }

        // retroalimentar cellphoneserialized se ainda não tiver
        if (phoneKey && !verifyExist.cellphoneserialized) {
          updatePhonePayload.cellphoneserialized = phoneKey
        }

        if (Object.keys(updatePhonePayload).length > 0) {
          await Shippingcampaign.query()
            .where('id', verifyExist.id)
            .update(updatePhonePayload)
        }
      }

      // 🔹 BLOCO 2: se já existe e não tinha gupshupParams, atualiza SÓ os params
      if (
        verifyExist &&
        (verifyExist.gupshupParams == null || String(verifyExist.gupshupParams).trim() === '') &&
        shipping.gupshupParams
      ) {
        await Shippingcampaign.query()
          .where('id', verifyExist.id)
          .update({
            gupshupParams: shipping.gupshupParams,
          })
      }

      // 🔹 se NÃO existe, cria normalmente
      if (!verifyExist) {
        await Shippingcampaign.create(shipping)
        patientList.push({ reg: shipping.reg, name: shipping.name, unit: shipping.unit })
      }
    } catch (error) {
      console.log('Erro ao criar Shippingcampaign', { reg: data?.reg, interaction_id: data?.interaction_id }, error)
    }
  }

  return patientList
}
