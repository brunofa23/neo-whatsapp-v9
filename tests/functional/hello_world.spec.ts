
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'



test('display welcome page', async ({ client }) => {

  const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
      const query = Shippingcampaign.query()
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhere('created_at', '>', yesterday)

      // if (agentCompany?.company_id) {
      //   query.andWhere('company_id', agentCompany?.company_id)
      // }
      //else query.whereNull('company_id')
      query.whereNotExists((subquery) => {
        subquery.select('*').from('chats')
        .whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id')
        .andWhereNull('chats.excluded')
      })
      // if (agentCompany?.interaction_priority?.toLocaleUpperCase() === 'CONFIRMATION')
      //   query.orderByRaw('(interaction_id!=1),RAND()').limit(10)
      // else if (agentCompany?.interaction_priority?.toLocaleUpperCase() === 'EVALUATION')
      //   query.orderByRaw('(interaction_id!=2),RAND()').limit(10)
      // else
        query.orderByRaw('RAND()').limit(10)

      console.log(">>>>", query.toQuery())
})
