
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'



test('display welcome page', async ({ client }) => {

  console.log("passei no RESEND............................")
      const now = DateTime.now()
      const yesterdayStart = now.minus({ days: 1 }).startOf('day')
      const yesterdayEnd = now.minus({ days: 1 }).endOf('day')
      const tomorrowStart = now.plus({ days: 1 }).startOf('day')
      const tomorrowEnd = now.plus({ days: 1 }).endOf('day')
      const yesterdayNoon = now.minus({ days: 1 }).set({ hour: 12, minute: 0, second: 0, millisecond: 0 })


      // 🔹 Atualiza mensagens para reenvio
      const query=  Shippingcampaign.query()
        .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
        .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
        .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
        .andWhere('interaction_id', 1)
        .whereNull('phonevalid')
        // .update({
        //   createdAt: DateTime.now().toSQL({ includeOffset: false })
        // })

        const updatedResend = await query
        //console.log(query.toQuery())

      // 🔹 Atualiza CHATS (pacientes sem resposta)
      const subquery = Database.from('chats')
        .innerJoin('shippingcampaigns', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .where('shippingcampaigns.created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('shippingcampaigns.created_at', '<=', yesterdayNoon.toSQL({ includeOffset: false }))
        .where('shippingcampaigns.interaction_id', 1)
        .where('shippingcampaigns.interaction_seq', 1)
        .where('chats.returned', 0)
        .where('chats.ack', 2)
        .select('chats.id')

       await Chat.query()
        .whereIn('id', Database.from(subquery.as('temp')))

      console.log(subquery.toQuery())
      //   .update({ excluded: 1 })

      // // 🔹 Atualiza SHIPPINGCAMPAIGNS com mesmo filtro
      // const subquery1 = Database
      //   .from('shippingcampaigns as sc')
      //   .innerJoin('chats as c', 'sc.id', 'c.shippingcampaigns_id')
      //   .where('sc.created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
      //   .where('sc.created_at', '<=', yesterdayNoon.toSQL({ includeOffset: false }))
      //   .where('sc.interaction_id', 1)
      //   .where('sc.interaction_seq', 1)
      //   .where('c.returned', 0)
      //   .where('c.ack', 2)
      //   .select('sc.id')

      // const updatedShipping = await Shippingcampaign
      //   .query()
      //   .joinRaw(`JOIN (${subquery1.toQuery()}) as temp on shippingcampaigns.id = temp.id`)
      //   //.update({ createdAt: DateTime.now().toSQL({ includeOffset: false }), phonevalid: null, messagesent: 0 })

      // console.log(">>>>update::", updatedShipping)


})
