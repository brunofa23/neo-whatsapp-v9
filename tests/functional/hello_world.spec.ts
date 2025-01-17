import { test } from '@japa/runner'
import Response from 'App/Models/Response'
import ResponsesController from 'App/Controllers/Http/ResponsesController'
import Log from 'App/Models/Log'
import Agent from 'App/Models/Agent'

test('display welcome page', async ({ client }) => {

  const formatMessage = (template, fields) => {
    return template
   .replace('${chatOtherFields.address}', fields.address || 'Endereço indisponível')
   .replace('${chatOtherFields.medic}', fields.medic || 'Médico não informado')
   .replace('${chatOtherFields.phone_unit}', fields.phone_unit || 'Contato indisponível');
};

  const response1schedule = await Response.query()
          .select('message')
          .where('local', 'response1schedule')
          .andWhere('inactive', false)
          .first();


    const teste = formatMessage(response1schedule?.message,
      'Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chatOtherFields.phone_unit}.')

          console.log(teste)

  //      const defaultMessage = `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chat.shippingcampaign.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chat.shippingcampaign.phone_unit}.`;

        // const response1message = response1schedule
        //   ? formatMessage(response1schedule.message, chatOtherFields)
        //   : defaultMessage;

})
