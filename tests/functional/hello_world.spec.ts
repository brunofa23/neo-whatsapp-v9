
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'



test('display welcome page', async ({ client }) => {

  // const todayStart = DateTime.now().minus({ days: 1 }).startOf('day')
  // const todayEnd = DateTime.now().minus({ days: 1 }).endOf('day')
  const todayStart = DateTime.now().startOf('day')
  const todayEnd = DateTime.now().endOf('day')

  console.log("teste General", todayStart, todayEnd)

  const query = Shippingcampaign.query()
    .select('id', 'reg', 'interaction_id', 'phonevalid', 'messagesent')
    .whereBetween('created_at', [todayStart.toSQL({ includeOffset: false }),
    todayEnd.toSQL({ includeOffset: false })])

  const shippingcampaigns = await query
  const filteredShendule = shippingcampaigns.filter(item => item.interaction_id === 1)
  const filteredEvalutation = shippingcampaigns.filter(item => item.interaction_id === 2)

  const queryChat = Chat.query()
    .select('id', 'interaction_id', 'interaction_seq', 'ack', 'returned')
    .whereBetween('created_at', [todayStart.toSQL({ includeOffset: false }),
    todayEnd.toSQL({ includeOffset: false })])
  const chats = await queryChat

  const filteredChatSended = chats.filter(item => item.ack>=2)
  const filteredChatReturned = chats.filter(item => item.ack>=2 && !!item.returned===true)
  const filteredChatScheduleSended = chats.filter(item => item.interaction_id === 1 && item.interaction_seq===1 && item.ack>=2)
  const filteredChatScheduleReturned = chats.filter(item => item.interaction_id === 1 && item.interaction_seq===1 && item.ack>=2 && !!item.returned===true)
  const filteredChatEvaluationSended = chats.filter(item => item.interaction_id === 2 && item.ack>=2)
  const filteredChatEvaluationReturned = chats.filter(item => item.interaction_id === 2 && item.ack>=2 && !!item.returned===true)


  console.log(`TOTAL DE MENSAGENS PARA ENVIAR NO DIA:${shippingcampaigns.length} - AGENDAMENTO:${filteredShendule.length} - CONFIRMAÇÃO:${filteredEvalutation.length}`)
  console.log(`TOTAL DE MENSAGENS ENVIADAS:${filteredChatSended.length} - AGENDAMENTO:${filteredChatScheduleSended.length} - CONFIRMAÇÃO:${filteredChatEvaluationSended.length}`)
  console.log(`TOTAL DE MENSAGENS RETORNADAS:${filteredChatReturned.length} - AGENDAMENTO:${filteredChatScheduleReturned.length} - CONFIRMAÇÃO:${filteredChatEvaluationReturned.length}`)



})
