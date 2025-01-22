import { test } from '@japa/runner'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import Chat from 'App/Models/Chat'
import Unit from 'App/Models/Unit'
import { getSchedulesApi, confirmOrCancelScheduleApi } from 'App/Services/requestExternal/request'
import { ValidatePhone } from 'App/Services/whatsapp-web/util'
import ResponsesController from './ResponsesController'
import { DateTime } from 'luxon'

test('display welcome page', async ({ client }) => {

  //chmamar a API DO KLINGO

  const returnAck =  Chat.query()
  .where('message', 'Saudações! Aqui é a Iris atendente virtual do Cob, o motivo do meu contato Sra. ROSINHA é para confirmar o horário conosco, agendado para o dia *03/02/2025 13:00* na unidade BH (BAIRRO SANTA EFIGÊNIA) - CENTRO DE OFTALMOLOGIA BRASIL com Dr(a). COB podemos confirmar? *1* para Sim *2* para Desmarcar.Caso não haja interação em até 12 horas, o agendamento será automaticamente cancelado.')
  .andWhere('cellphoneserialized', '553185228619@c.us')
  .andWhere('chatnumber', 'LIKE' , String('553196218275@c.us').replace(/\D/g, ''));

  console.log(returnAck.toQuery())
  const teste = await returnAck


  //console.log(returnAck)


})
