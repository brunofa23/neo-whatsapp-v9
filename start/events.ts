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

// import Chat from "App/Models/Chat";
// import Database from "@ioc:Adonis/Lucid/Database";


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

//BUSCANDO NO SMART
async function sendRepeatedMessage() {
  console.log('EXECUTANDO BUSCA SMART')

  const raw = Number(process.env.TIME_SENDREPEATEDMESSAGE)
  const intervalMs = Number.isFinite(raw) && raw >= 5_000 ? raw : 50_000
  let running = false

  const scheduleNext = () => setTimeout(tick, intervalMs)

  const tick = async () => {
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
        // ✅ interação 1 depende de data: roda por data
        for (const date of targetDates) {
          const formatted = date.toFormat('yyyy-MM-dd')
          console.log(`Buscando dados no Smart(Server) [interaction=1]: ${formatted}`)
          await PersistShippingcampaign(formatted, false, 1)
        }

        // ✅ interação 2 não depende de data: roda 1x por ciclo
        console.log(`Buscando dados no Smart(Server) [interaction=2]`)
        await PersistShippingcampaign(DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd'), false, 2)

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

  void tick()
}

// BUSCANDO NO KLINGO (melhorado: sem sobreposição, com try/catch, await, timers mais seguros)
async function sendRepeatedMessageKlingo() {
  console.log("PASSO 1 KLINGO...")
  // =========================
  // helpers
  // =========================
  const zone = "America/Sao_Paulo"

  const parseIntervalMs = (raw: any, fallback = 5000) => {
    const n = Number(raw)
    // evita 0, NaN e valores muito baixos que “espancam” sua API
    return Number.isFinite(n) && n >= 1000 ? n : fallback
  }

  const computeTargetDate = () => {
    const today = DateTime.local().setZone(zone)

    // Luxon: weekday 1=Mon ... 7=Sun
    const daysToAdd =
      today.weekday >= 1 && today.weekday <= 4 ? 2 : // seg-qui → +2
        today.weekday === 5 ? 3 :                      // sex → +3 (segunda)
          today.weekday === 6 ? 3 :                      // sáb → +3 (terça)
            null                                           // dom → não envia

    if (daysToAdd === null) return null
    return today.plus({ days: daysToAdd }).toFormat("yyyy-MM-dd")
  }

  // =========================
  // loop 1: buscar agendas
  // =========================
  const intervalMs = parseIntervalMs(process.env.TIME_SENDREPEATEDMESSAGE, 5000)

  let schedulesTimer: NodeJS.Timeout | null = null
  let schedulesRunning = false

  const schedulesTick = async () => {
    schedulesTimer = setTimeout(schedulesTick, intervalMs)

    if (schedulesRunning) {
      console.log("[Klingo][getSchedules] tick ignorado (execução anterior em andamento)")
      return
    }

    schedulesRunning = true
    try {
      const date = computeTargetDate()
      if (!date) return // domingo

      if (await TimeSchedule()) {
        console.log(`Buscando dados no Klingo: ${date}`)
        console.log("PASSO 2 KLINGO...")
        const datasourceApisController = new DatasourceApisController()
        console.log("PASSO 3 KLINGO...")
        await datasourceApisController.getSchedulesInternal(date)
        console.log("PASSO 4 KLINGO...")

      }
    } catch (err) {
      console.error("[Klingo][getSchedules] erro:", err)
    } finally {
      schedulesRunning = false
    }
  }

  // =========================
  // loop 2: confirmar/cancelar (random a CADA execução, sem sobreposição)
  // =========================
  let confirmTimer: NodeJS.Timeout | null = null
  let confirmRunning = false

  const confirmTick = async () => {
    // agenda o próximo com random NOVO (em vez de random fixo no setInterval)
    let nextMs = 5000
    try {
      nextMs = await GenerateRandomTime(500, 550, "****Send Message Repeated")
    } catch (e) {
      // se der erro no random, mantém um fallback
      nextMs = 30_000
    }
    confirmTimer = setTimeout(confirmTick, nextMs)

    if (confirmRunning) {
      console.log("[Klingo][confirmOrCancel] tick ignorado (execução anterior em andamento)")
      return
    }

    confirmRunning = true
    try {
      if (await TimeSchedule()) {
        console.log(
          `Atualizando confirmações no Klingo: ${DateTime.now().setZone(zone).toFormat("dd/MM/yyyy HH:mm")}`
        )
        const datasourceApisController = new DatasourceApisController()
        await datasourceApisController.confirmOrCancelScheduleInternal()
      }
    } catch (err) {
      console.error("[Klingo][confirmOrCancel] erro:", err)
    } finally {
      confirmRunning = false
    }
  }

  // start
  schedulesTick()
  confirmTick()

  // opcional: permitir parar os loops (útil em shutdown/PM2 reload)
  return {
    stop() {
      if (schedulesTimer) clearTimeout(schedulesTimer)
      if (confirmTimer) clearTimeout(confirmTimer)
      schedulesTimer = null
      confirmTimer = null
    },
  }
}



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

async function resetStatusConnected() {
  await Agent.query().update({ status: null, statusconnected: false })
}

export { connectionAll, sendRepeatedMessage, resetStatusConnected, destroyFullAgents, sendRepeatedMessageKlingo, resendMessage }

