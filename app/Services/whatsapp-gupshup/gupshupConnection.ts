import Agent from 'App/Models/Agent'
import Config from 'App/Models/Config'
import { DateTime } from 'luxon'
import SendDispatcher from 'App/Services/SendDispatcher'
import { GenerateRandomTime } from 'App/Services/whatsapp-web/util'

// ========= status global (copiado do seu padrão) =========
async function getStatusSendMessage() {
  const result = await Config.query()
    .select('valuebool', 'valuedatetime')
    .where('id', 'statusSendMessage')
    .first()

  const valuebool = result?.$attributes?.valuebool
  const valuedatetime = result?.$attributes?.valuedatetime
  if (!valuedatetime) return false

  const dateNow = DateTime.now()
  const dateConfig = DateTime.fromJSDate(valuedatetime)
  const diffMinutes = dateNow.diff(dateConfig).as('minutes')

  return valuebool == 1 && diffMinutes > 5
}

// ========= loop por agent =========
const gupshupTimers = new Map<number, NodeJS.Timeout>()
const gupshupLocks = new Set<number>()

export function stopGupshupLoop(agentId: number) {
  const t = gupshupTimers.get(agentId)
  if (t) clearTimeout(t)
  gupshupTimers.delete(agentId)
  gupshupLocks.delete(agentId)
}

export function startGupshupLoop(agent: Agent) {
  const agentId = agent.id

  // mata loop anterior
  stopGupshupLoop(agentId)

  const tick = async () => {
    try {

      if (gupshupLocks.has(agentId)) return
      gupshupLocks.add(agentId)

      const statusSendMessage = await getStatusSendMessage()
      if (statusSendMessage) {
        // ✅ chama dispatcher sem client
        
        await SendDispatcher({ agent, client: null })
        //console.log("VERIFICANDO SE TEM ID TEMPLATE")
      }
    } catch (e) {
      console.error(`[${agentId}] Erro no loop Gupshup:`, e)
    } finally {
      gupshupLocks.delete(agentId)

      // usa os mesmos intervalos do agent (se quiser)
      const fresh = await Agent.query()
        .select('interval_init_message', 'interval_final_message')
        .where('id', agentId)
        .first()

      const startSafe = Number(fresh?.interval_init_message || 60000)
      const endSafe = Number(fresh?.interval_final_message || 80000)

      const delay = await GenerateRandomTime(startSafe, endSafe, '----Time Send Message Gupshup')

      const id = setTimeout(tick, delay)
      gupshupTimers.set(agentId, id)
    }
  }

  tick()
}
