import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { ValidatePhone } from './util'
import { DateTime } from 'luxon'
import { normalizePhoneKey } from 'App/Services/whatsapp-web/util'
import Log from 'App/Models/Log' // ⬅️ IMPORT DO LOG

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
      // 🔍 DEBUG 1: GRAVA TUDO QUE VOLTOU DO BANCO LEGADO
      try {
        await Log.create({
          name: 'PersistShippingcampaign',
          messagem: JSON.stringify({
            step: 'raw-data',
            data,
            meta: {
              dateParam: date,
              prioritysend,
              interaction_id,
              unit_cod,
            },
          }),
        })
      } catch (logError) {
        console.log('Erro ao gravar log PersistShippingcampaign (raw-data)', logError)
      }

      if (!data?.reg || !data?.interaction_id) {
        // 🔍 DEBUG 2: loga quando pula registro
        try {
          await Log.create({
            name: 'PersistShippingcampaign',
            messagem: JSON.stringify({
              step: 'skip-invalid',
              reason: 'reg or interaction_id missing',
              data,
            }),
          })
        } catch (logError) {
          console.log('Erro ao gravar log PersistShippingcampaign (skip-invalid)', logError)
        }
        continue
      }

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

      // 🔍 DEBUG 3: LOGA SHIPPING MONTADO (antes de consultar se existe)
      try {
        await Log.create({
          name: 'PersistShippingcampaign',
          messagem: JSON.stringify({
            step: 'shipping-built',
            shipping: shipping.toJSON(), // toJSON pra não dar problema de serialização
          }),
        })
      } catch (logError) {
        console.log('Erro ao gravar log PersistShippingcampaign (shipping-built)', logError)
      }

      const verifyExist = await Shippingcampaign.query()
        .where('reg', data.reg)
        .andWhere('created_at', '>=', since)
        .andWhere('interaction_id', data.interaction_id)
        .first()

      const phoneKey = phone ? normalizePhoneKey(phone) : null

      // 🔍 DEBUG 4: ACHOU/NAO ACHOU REGISTRO EXISTENTE
      try {
        await Log.create({
          name: 'PersistShippingcampaign',
          messagem: JSON.stringify({
            step: 'verify-exist',
            reg: data.reg,
            interaction_id: data.interaction_id,
            found: !!verifyExist,
            existing: verifyExist ? verifyExist.toJSON() : null,
          }),
        })
      } catch (logError) {
        console.log('Erro ao gravar log PersistShippingcampaign (verify-exist)', logError)
      }

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

          // 🔍 DEBUG 5: loga update de phone
          try {
            await Log.create({
              name: 'PersistShippingcampaign',
              messagem: JSON.stringify({
                step: 'update-phone',
                reg: data.reg,
                interaction_id: data.interaction_id,
                updatePhonePayload,
              }),
            })
          } catch (logError) {
            console.log('Erro ao gravar log PersistShippingcampaign (update-phone)', logError)
          }
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

        // 🔍 DEBUG 6: update de gupshupParams
        try {
          await Log.create({
            name: 'PersistShippingcampaign',
            messagem: JSON.stringify({
              step: 'update-gupshupParams',
              reg: data.reg,
              interaction_id: data.interaction_id,
              newGupshupParams: shipping.gupshupParams,
            }),
          })
        } catch (logError) {
          console.log('Erro ao gravar log PersistShippingcampaign (update-gupshupParams)', logError)
        }
      }

      // 🔹 se NÃO existe, cria normalmente
      if (!verifyExist) {
        const created = await Shippingcampaign.create(shipping)
        patientList.push({ reg: created.reg, name: created.name, unit: created.unit })

        // 🔍 DEBUG 7: criação de novo registro
        try {
          await Log.create({
            name: 'PersistShippingcampaign',
            messagem: JSON.stringify({
              step: 'create-shipping',
              created: created.toJSON(),
            }),
          })
        } catch (logError) {
          console.log('Erro ao gravar log PersistShippingcampaign (create-shipping)', logError)
        }
      }
    } catch (error) {
      console.log('Erro ao criar Shippingcampaign', { reg: data?.reg, interaction_id: data?.interaction_id }, error)

      // 🔍 DEBUG 8: log de erro geral
      try {
        await Log.create({
          name: 'PersistShippingcampaign',
          messagem: JSON.stringify({
            step: 'error',
            reg: data?.reg,
            interaction_id: data?.interaction_id,
            error: String(error?.message || error),
            stack: error?.stack,
          }),
        })
      } catch (logError) {
        console.log('Erro ao gravar log PersistShippingcampaign (error)', logError)
      }
    }
  }

  return patientList
}


//############################################################################################################################
// Como usar esses logs pra achar o “maldito problema”
// Na tabela logs:
// Filtra por: name = 'PersistShippingcampaign'
// Depois olha por step dentro do JSON (raw-data, shipping-built, verify-exist, update-gupshupParams, create-shipping, etc.)
// Pra focar no problema do gupshupParams:
// Procura registros onde step = 'raw-data' e vê se data.gupshupParams está vindo preenchido.
// Compara com os shipping-built e com os create-shipping / update-gupshupParams.
// Se em raw-data veio certo mas em shipping-built ou create-shipping está null, o bug está na transformação.
// Se nem em raw-data veio algo, o problema está na query do SQL Server mesmo.
// Se quiser, depois que você rodar isso e pegar um exemplo real (copia um log de raw-data + shipping-built + create-shipping) e me manda, que eu te ajudo a fechar o diagnóstico em cima de um caso re
