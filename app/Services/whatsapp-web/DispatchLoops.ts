/**
 * /app/Services/whatsapp/dispatch/dispatchloops.ts
 */

import Agent from 'App/Models/Agent'
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController'
import sendMessage from 'App/Services/whatsapp-web/SendMessage'
import { TimeSchedule } from 'App/Services/whatsapp-web/util'
import { DateTime } from 'luxon'
import Log from 'App/Models/Log'

// helper sleep
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// random entre min e max em segundos
function randomMs(minSec: number, maxSec: number) {
  const min = Math.ceil(minSec * 1000)
  const max = Math.ceil(maxSec * 1000)
  return Math.floor(Math.random() * (max - min) + min)
}

// pega um agente aleatório
function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export default async function dispatchLoop() {
  console.log('🟢 DispatchLoop iniciado')

  // controllers
  const shippingCtrl = new ShippingcampaignsController()

  while (true) {
    try {
      // respeita agenda
      if (!(await TimeSchedule())) {
        await sleep(15_000)
        continue
      }

      // busca todos agentes conectados pelo campo statusconnected
      const agentsConnected = await Agent.query()
        .where('statusconnected', true)
        .andWhere('status', 'CONNECTED')

      if (!agentsConnected || agentsConnected.length === 0) {
        console.log('⚠️ Nenhum agente conectado no momento')
        await sleep(15_000)
        continue
      }

      // 2) escolhe UM agente aleatório
      const agent = pickRandom(agentsConnected)

      // 1) pega UMA campanha pendente
      const campaign = await shippingCtrl.patientToSend(agent)

      // se você não tiver esta função, eu já explico como fazer abaixo

      if (!campaign) {
        console.log('🟡 Nenhuma campanha pendente')
        await sleep(10_000)
        continue
      }


      // 3) envia (client = null, porque agora sendMessage sabe decidir pelo provider_type)
      await sendMessage(null, agent)

      // 4) tempo entre envios randomizado
      const delay = randomMs(
        agent.min_time_send || 5,   // segundos configurados no agent
        agent.max_time_send || 25
      )

      console.log(
        `⏳ Aguardando ${delay / 1000}s - Agent ${agent.name} - Campanha ${campaign.id}`
      )

      await sleep(delay)
    } catch (error) {
      console.error('❌ ERRO DISPATCH LOOP', error)

      await Log.create({
        name: 'DispatchLoop',
        message: String(error),
        description: 'Erro no dispatchLoop principal',
      })

      // se der erro sério, espera e continua
      await sleep(15_000)
    }
  }
}
