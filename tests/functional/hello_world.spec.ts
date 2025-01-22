import { test } from '@japa/runner'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Unit from 'App/Models/Unit'
import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'
import Response from 'App/Models/Response'
test('display welcome page', async ({ client }) => {

  //chmamar a API DO KLINGO
  const formatMessage = (template, fields) => {
    return template
   .replace('{name_unit}', fields.name_unit)
   .replace('{address_unit}', fields.address_unit || 'Endereço indisponível')
   .replace('{medic}', fields.medic || 'Médico não informado')
   .replace('{phone_unit}', fields.phone_unit || 'Contato indisponível')
   .replace('{schedule}', fields.schedule)
};

  const chatOtherFields = JSON.parse(`{"address_unit":"Rua Álvares Maciel, 356 - Santa Efigênia - BH","medic":"ALINE TEIXEIRA GUIDINE","schedule":"2025-01-23 07:30","phone_unit":"(31) 3227-1000","name_unit":"BH (BAIRRO SANTA EFIGÊNIA) - CENTRO DE OFTALMOLOGIA BRASIL"}`)

  //console.log(chatOtherFields.address_unit)

  const response1schedule = await Response.query()
    .select('message')
    .where('local', 'response1schedule')
    .andWhere('inactive', false)
    .first();

  const defaultMessage = "teste"//`Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é {chat.shippingcampaign.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp {chat.shippingcampaign.phone_unit}.`;


  const response1message = response1schedule
  ? formatMessage(response1schedule.message, chatOtherFields)
  : defaultMessage;


  console.log(response1message)

})
