import { test } from '@japa/runner'
import Response from 'App/Models/Response'
import ResponsesController from 'App/Controllers/Http/ResponsesController'
import Log from 'App/Models/Log'
import Agent from 'App/Models/Agent'
import { DateFormat, RandomResponse, stateTyping } from '../../app/Services/whatsapp-web/util'
import Chat from 'App/Models/Chat'

test('display welcome page', async ({ client }) => {


  const chatOtherFields = {
    address_unit: 'Av. Augusto de Lima, 1126 - Barro Preto - BH',
    medic: 'ANA FLAVIA DIAS MEDEIROS',
    schedule: '2025-01-29 08:20',
    phone_unit: '(31) 3227-1000',
    name_unit: 'BH (BAIRRO BARRO PRETO) - CENTRO DE OFTALMOLOGIA BRASIL'
  }
  console.log(chatOtherFields)

  const response1schedule = await Response.query()
            .select('message')
            .where('local', 'response1schedule')
            .andWhere('inactive', false)
            .first();

  //console.log(">>",response1schedule?.message)


  const formatMessage = (template, fields) => {
    return template
   // .replace('${chatOtherFields.address}', fields.address || 'Endereço indisponível')
   // .replace('${chatOtherFields.medic}', fields.medic || 'Médico não informado')
   // .replace('${chatOtherFields.phone_unit}', fields.phone_unit || 'Contato indisponível');
   .replace('{name_unit}', fields.name_unit)
   .replace('{address_unit}', fields.address || 'Endereço indisponível')
   .replace('{medic}', fields.medic || 'Médico não informado')
   .replace('{phone_unit}', fields.phone_unit || 'Contato indisponível')
   .replace('{schedule}', fields.schedule)
};

const teste = formatMessage(response1schedule.message, chatOtherFields)
console.log("teste:::", teste)

})
