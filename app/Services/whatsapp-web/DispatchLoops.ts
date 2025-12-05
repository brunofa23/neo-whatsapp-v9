const timers = new Map<number, NodeJS.Timeout>()
const locks = new Set<number>()

export function stopDispatchLoop(agentId: number) {
  const t = timers.get(agentId)
  if (t) clearTimeout(t)
  timers.delete(agentId)
  locks.delete(agentId)
}

export function startDispatchLoop(
  agent: Agent,
  sender: () => Promise<void>,
  getStatusSendMessage: () => Promise<boolean>,
  GenerateRandomTime: (...args:any[]) => Promise<number>
) {
  stopDispatchLoop(agent.id)

  const tick = async () => {
    try {
      if (locks.has(agent.id)) return
      locks.add(agent.id)

      const ok = await getStatusSendMessage()
      if (ok) {
        await sender()
      }
    } catch (e) {
      console.error(`[${agent.id}] DispatchLoop error:`, e)
    } finally {
      locks.delete(agent.id)

      const delay = await GenerateRandomTime(
        agent.interval_init_message,
        agent.interval_final_message,
        'DispatchLoop'
      )

      const id = setTimeout(tick, delay)
      timers.set(agent.id, id)
    }
  }

  tick()
}
