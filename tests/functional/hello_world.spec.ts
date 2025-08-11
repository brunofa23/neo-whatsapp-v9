
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'



test('display welcome page', async ({ client }) => {

  const now = DateTime.now()
  const yesterdayStart = now.minus({ days: 3 }).startOf('day')
  const yesterdayEnd = now.minus({ days: 1 }).endOf('day')
  const tomorrowStart = now.plus({ days: 1 }).startOf('day')
  const tomorrowEnd = now.plus({ days: 1 }).endOf('day')


  const query = Chat.query()
    .whereIn(
      'id',
      Database.from('chats')
        .innerJoin('shippingcampaigns', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .where('shippingcampaigns.created_at', '>=', `${yesterdayStart}`)
        .where('shippingcampaigns.created_at', '<=', `${yesterdayEnd}`)
        .where('shippingcampaigns.interaction_id', 1)
        .where('shippingcampaigns.interaction_seq', 1)
        .where('chats.returned', 0)
        .where('chats.ack', 2)
        .select('chats.id')
    )
    .update({ excluded: 1 })
    const chatToDelete = await query
    console.log(">>", query.toQuery())


  // 🔹 Atualizar SHIPPINGCAMPAIGNS com base no mesmo filtro
  const query2 = Shippingcampaign.query()
    .whereIn(
      'id',
      Database.from('shippingcampaigns')
        .innerJoin('chats', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .where('shippingcampaigns.created_at', '>=', `${yesterdayStart}`)
        .where('shippingcampaigns.created_at', '<=', `${yesterdayEnd}`)
        .where('shippingcampaigns.interaction_id', 1)
        .where('shippingcampaigns.interaction_seq', 1)
        .where('chats.returned', 0)
        .where('chats.ack', 2)
        .select('shippingcampaigns.id')
    )
  //.update({ createdAt: '2025-08-08' }) // cuidado com o nome da coluna no Model
  const shipping = await query2
  console.log(">>>>>>", query.toQuery())

})
