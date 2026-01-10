import AgentsController from "App/Controllers/Http/AgentsController";
import DatasourcesController from "App/Controllers/Http/DatasourcesController";
import DatasourceApisController from "App/Controllers/Http/DatasourceApisController";
import Agent from "App/Models/Agent"
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import Shippingcampaign from "App/Models/Shippingcampaign";
import { DateTime } from 'luxon';
import { getTargetDates, GenerateRandomTime, TimeSchedule } from '../app/Services/whatsapp-web/util'
import { startAgentChat } from "../app/Services/whatsapp-web/whatsapp"
import { startAgent } from "../app/Services/whatsapp-web/whatsappConnection"
import '../app/Services/plugins/axios'
import Log from "App/Models/Log";
import { startGupshupLoop } from "../app/Services/whatsapp-gupshup/gupshupConnection"

import Chat from "App/Models/Chat";
import Database from "@ioc:Adonis/Lucid/Database";


async function destroyFullAgents() {
  console.log("Passei no destroy agentes 1222")
  const destroyAgents = new AgentsController
  await destroyAgents.destroyFullAgents()
}

async function connectionAll() {
  try {
    console.log("connection all acionado...")

    // reseta status visual
    await Agent.query().update({ statusconnected: false, qrcode: null })

    const agents = await Agent.query()
      .where('active', true)
      .where((q) => q.whereNull('deleted').orWhere('deleted', false))

    for (const agent of agents) {
      if (!agent) continue

      const provider = (agent.provider_type || 'wwebjs').toLowerCase()

      // ===============================
      // AGENTE DEFAULT (CHAT INTERNO)
      // ===============================
      if (agent.default_chat) {
        console.log(`Conectando Agente Default: ${agent.name}`)
        startAgentChat(agent).catch(console.error)
        continue
      }

      // ===============================
      // AGENTE GUPSHUP (SEM WEBJS)
      // ===============================
      if (provider === 'gupshup') {
        console.log(`Conectando Agente Envio (GUPSHUP): ${agent.name}`)

        // status apenas informativo
        await Agent.query()
          .where('id', agent.id)
          .update({
            status: 'GUPSHUP',
            statusconnected: true,
            qrcode: null,
          })

        // inicia loop próprio do gupshup (sem client)
        console.log("PASSEI AQUI 1")
        startGupshupLoop(agent)

        continue
      }

      // ===============================
      // AGENTE WEBJS (PADRÃO)
      // ===============================
      console.log(`Conectando Agente Envio (WEBJS): ${agent.name}`)
      startAgent(agent).catch(console.error)
    }

  } catch (error) {
    console.error("Erro em connectionAll:", error)
  }
}



// async function sendRepeatedMessage() {
//   console.log("EXECUTANDO BUSCA SMART")
//   setInterval(async () => {
//     const targetDates = getTargetDates()
//     if (await TimeSchedule()) {
//       for (const date of targetDates) {
//         const formatted = date.toFormat('yyyy-MM-dd')
//         console.log(`Buscando dados no Smart(Server): ${formatted}`)
//         await PersistShippingcampaign(formatted)
//       }
//       const datasourcesController = new DatasourcesController
//       await datasourcesController.confirmScheduleAll()
//       await datasourcesController.cancelScheduleAll()

//     }
//   }, Number(process.env.TIME_SENDREPEATEDMESSAGE || 50000))
// }

async function sendRepeatedMessage() {
  console.log('EXECUTANDO BUSCA SMART')

  const raw = Number(process.env.TIME_SENDREPEATEDMESSAGE)
  const intervalMs = Number.isFinite(raw) && raw >= 5_000 ? raw : 50_000 // mínimo 5s (ajuste)
  let running = false

  const tick = async () => {
    // impede sobreposição
    if (running) {
      console.log('[sendRepeatedMessage] tick ignorado (execução anterior ainda em andamento)')
      scheduleNext()
      return
    }

    running = true
    const startedAt = Date.now()

    try {
      const targetDates = getTargetDates()

      if (await TimeSchedule()) {
        // Se quiser manter 100% sequencial (como está hoje), ok:
        for (const date of targetDates) {
          const formatted = date.toFormat('yyyy-MM-dd')
          console.log(`Buscando dados no Smart(Server): ${formatted}`)
          await PersistShippingcampaign(formatted)
        }

        const datasourcesController = new DatasourcesController()
        await datasourcesController.confirmScheduleAll()
        await datasourcesController.cancelScheduleAll()
      }
    } catch (err) {
      console.error('[sendRepeatedMessage] erro no ciclo:', err)
    } finally {
      running = false
      const elapsed = Date.now() - startedAt
      console.log(`[sendRepeatedMessage] ciclo finalizado em ${elapsed}ms`)
      scheduleNext()
    }
  }

  const scheduleNext = () => setTimeout(tick, intervalMs)

  // dispara já e depois agenda os próximos
  void tick()
}




// async function resendMessage() {
//   setInterval(async () => {
//     try {
//       console.log("passei no RESEND............................")
//       const now = DateTime.now()
//       const yesterdayStart = now.minus({ days: 1 }).startOf('day')
//       const yesterdayEnd = now.minus({ days: 1 }).endOf('day')
//       const tomorrowStart = now.plus({ days: 1 }).startOf('day')
//       const tomorrowEnd = now.plus({ days: 1 }).endOf('day')
//       //const yesterdayNoon = now.minus({ days: 1 }).set({ hour: 12, minute: 0, second: 0, millisecond: 0 })


//       // 🔹 Atualiza mensagens para reenvio
//       const updatedResend = await Shippingcampaign.query()
//         .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
//         .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
//         .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
//         .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
//         .andWhere('interaction_id', 1)
//         .whereNull('phonevalid')
//         .andWhere('messagesent', 0)
//         .andWhereNull('excluded')
//         .update({
//           createdAt: DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"),
//           resend: 1
//         })

//       //BUSCA 40 PACIENTES DO DIA ANTERIOR DE AVALIAÇÃO
//       const records = await Shippingcampaign.query()
//         .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
//         .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
//         .andWhere('interaction_id', 2)
//         .whereNull('phonevalid')
//         .andWhere('messagesent', 0)
//         .andWhereNull('excluded')
//         .limit(60) // <-- limita a busca
//         .select('id') // só traz os ids para performance
//       // pega apenas os ids
//       const ids = records.map(r => r.id)
//       if (ids.length > 0) {
//         await Shippingcampaign.query()
//           .whereIn('id', ids)
//           .update({
//             createdAt: DateTime.now().toFormat("yyyy-LL-dd HH:mm:ss"),
//             resend: 1
//           })
//         await Log.create({
//           name: "Resend",
//           message: `Reenvio de AVALIAÇÕES não enviadas no dia anterior. Total: ${ids.length}`,
//           description: "Function: resendMessage"
//         })

//       }


//       if (updatedResend[0] > 0) {
//         await Log.create({
//           name: "Resend",
//           message: `Reenvio de CONFIRMAÇÕES não enviadas no dia anterior. Total: ${updatedResend}`,
//           description: "Function: resendMessage"
//         })
//       }


//     } catch (error) {
//       console.error("Erro no resendMessage:", error)
//       // opcional: registrar no banco
//       await Log.create({
//         name: "ResendError",
//         message: error.message || "Erro desconhecido",
//         description: error.stack || "Sem stack trace"
//       })
//     }
//   }, 4 * 60 * 60 * 1000) // 4 horas
// }


//BUSCANDO NO KLINGO
async function resendMessage() {
  const intervalMs = 4 * 60 * 60 * 1000 // 4 horas
  let running = false

  const tick = async () => {
    // evita reentrância / overlap
    if (running) {
      console.log('[resendMessage] tick ignorado (execução anterior ainda em andamento)')
      return
    }

    running = true

    try {
      console.log('passei no RESEND............................')

      const now = DateTime.now()
      const yesterdayStart = now.minus({ days: 1 }).startOf('day')
      const yesterdayEnd = now.minus({ days: 1 }).endOf('day')
      const tomorrowStart = now.plus({ days: 1 }).startOf('day')
      const tomorrowEnd = now.plus({ days: 1 }).endOf('day')

      const nowSql = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')

      // 🔹 Atualiza mensagens para reenvio (CONFIRMAÇÕES)
      const updatedResendResult = await Shippingcampaign.query()
        .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
        .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
        .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
        .andWhere('interaction_id', 1)
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhereNull('excluded')
        .update({
          createdAt: nowSql,
          resend: 1,
        })

      // Lucid normalmente retorna number no update()
      const updatedResend =
        typeof updatedResendResult === 'number'
          ? updatedResendResult
          : Number((updatedResendResult as any)?.[0] ?? 0)

      // 🔹 BUSCA 60 PACIENTES DO DIA ANTERIOR DE AVALIAÇÃO
      const records = await Shippingcampaign.query()
        .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
        .andWhere('interaction_id', 2)
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhereNull('excluded')
        .limit(60)
        .select('id')

      const ids = records.map((r: any) => r.id)

      if (ids.length > 0) {
        await Shippingcampaign.query().whereIn('id', ids).update({
          createdAt: nowSql,
          resend: 1,
        })

        await Log.create({
          name: 'Resend',
          message: `Reenvio de AVALIAÇÕES não enviadas no dia anterior. Total: ${ids.length}`,
          description: 'Function: resendMessage',
        })
      }

      if (updatedResend > 0) {
        await Log.create({
          name: 'Resend',
          message: `Reenvio de CONFIRMAÇÕES não enviadas no dia anterior. Total: ${updatedResend}`,
          description: 'Function: resendMessage',
        })
      }
    } catch (error: any) {
      console.error('Erro no resendMessage:', error)

      // não deixa o próprio log derrubar o catch
      try {
        await Log.create({
          name: 'ResendError',
          message: error?.message ? String(error.message) : 'Erro desconhecido',
          description: error?.stack ? String(error.stack) : 'Sem stack trace',
        })
      } catch (logErr) {
        console.error('Erro ao gravar ResendError no banco:', logErr)
      }
    } finally {
      running = false
    }
  }

  setInterval(() => void tick(), intervalMs)

  // opcional: roda na inicialização também
  void tick()
}




async function sendRepeatedMessageKlingo() {

  // Função que será executada no intervalo
  setInterval(async () => {
    const today = DateTime.local().setZone("America/Sao_Paulo")
    let daysToAdd = null

    if (today.weekday >= 1 && today.weekday <= 4) {
      // Segunda a Quinta → +2
      daysToAdd = 2
    } else if (today.weekday === 5) {
      // Sexta → Segunda
      daysToAdd = 3
    } else if (today.weekday === 6) {
      // Sábado → Terça
      daysToAdd = 3
    } else if (today.weekday === 7) {
      // Domingo → não enviar
      return
    }

    const date = today.plus({ days: daysToAdd }).toFormat("yyyy-MM-dd")

    if (await TimeSchedule()) {
      console.log(`Buscando dados no Klingo: ${date}`)
      const datasourceApisController = new DatasourceApisController()
      datasourceApisController.getSchedulesInternal(date)
    }
  }, Number(process.env.TIME_SENDREPEATEDMESSAGE || 5000))

  //Atualiza os confirmados e cancelados
  //console.log("CONFIRM OR CANCEL DESABILITADO ****************")
  setInterval(async () => {
    if (await TimeSchedule()) {
      console.log(`Atualizando confirmações no Klingo: ${DateTime.now().toFormat("dd/MM/yyyy HH:mm")}`)
      const datasourceApisController = new DatasourceApisController
      datasourceApisController.confirmOrCancelScheduleInternal()
    }
  }, await GenerateRandomTime(500, 550, '****Send Message Repeated')
  )

}

async function resetStatusConnected() {
  await Agent.query().update({ status: null, statusconnected: false })
}

export { connectionAll, sendRepeatedMessage, resetStatusConnected, destroyFullAgents, sendRepeatedMessageKlingo, resendMessage }

