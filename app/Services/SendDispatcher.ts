import Env from '@ioc:Adonis/Core/Env'
import Agent from 'App/Models/Agent'
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import SendMessageGupshup from 'App/Services/whatsapp-gupshup/SendMessageGupshup'
import SendFromQueueGupshup from 'App/Services/whatsapp-gupshup/SendFromQueueGupshup'

// ✅ teste só 1x por agent (evita spam no loop)
const sentGupshupTestOnce: Set<number> =
  (global as any).sentGupshupTestOnce ??
  (((global as any).sentGupshupTestOnce = new Set<number>()) as Set<number>)

type DispatchCtx = { agent: Agent; client: any }

export default async function SendDispatcher({ agent, client }: DispatchCtx) {
  const provider = (agent.provider_type || 'wwebjs').toLowerCase()

  // =========================
  // WEBJS (igual ao seu atual)
  // =========================
  if (provider === 'wwebjs') {
    if (client) await SendMessage(client, agent)
    return
  }

  // =========================
  // GUPSHUP (teste OU fila real)
  // =========================
  if (provider === 'gupshup') {
     const testEnabled = String(Env.get('GUPSHUP_TEST', 'false')).toLowerCase() === 'true'

    // ✅ modo teste (1 vez por agent)
    if (testEnabled) {
      if (sentGupshupTestOnce.has(agent.id)) return
      sentGupshupTestOnce.add(agent.id)

      const destination = String(Env.get('GUPSHUP_TEST_DESTINATION', '')).replace(/\D/g, '')
      if (!destination) {
        console.log('[GUPSHUP_TEST] destination vazio. Defina GUPSHUP_TEST_DESTINATION no .env')
        return
      }

      await SendMessageGupshup({
        agent,
        destination,
        params: ['Bruno Favato', '26/12/2025 14:30', 'Unidade Centro', 'Dr. João Silva'],
      })

      return
    }

    // ✅ modo real (fila)
    await SendFromQueueGupshup(agent)
    return
  }

  // provider desconhecido → não faz nada
  console.log(`[SendDispatcher] provider_type inválido: ${agent.provider_type} (AgentId=${agent.id})`)
}
