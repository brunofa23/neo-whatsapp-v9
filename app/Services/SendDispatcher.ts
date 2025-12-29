import Env from '@ioc:Adonis/Core/Env'
import Agent from 'App/Models/Agent'
import SendMessage from 'App/Services/whatsapp-web/SendMessage'
import SendMessageGupshup from 'App/Services/whatsapp-gupshup/SendMessageGupshup'

type DispatchCtx = { agent: Agent; client: any }

// ✅ envia teste só 1x por agent (não spamma no loop)
const sentGupshupTestOnce: Set<number> =
  (global as any).sentGupshupTestOnce ?? (((global as any).sentGupshupTestOnce = new Set<number>()) as Set<number>)

export default async function SendDispatcher({ agent, client }: DispatchCtx) {
  const provider = (agent.provider_type || 'wwebjs').toLowerCase()

  // ✅ WWebJS (mantém seu SendMessage atual)
  if (provider === 'wwebjs' || provider === 'both') {
    if (client) await SendMessage(client, agent)
  }

  // ✅ Gupshup (template)
  if (provider === 'gupshup' || provider === 'both') {
    const testEnabled = String(Env.get('GUPSHUP_TEST', 'false')).toLowerCase() === 'true'
    if (!testEnabled) return

    // ✅ garante que cada agent mande 1x só
    if (sentGupshupTestOnce.has(agent.id)) return
    sentGupshupTestOnce.add(agent.id)

    const destination = String(Env.get('GUPSHUP_TEST_DESTINATION', '')).replace(/\D/g, '')
    if (!destination) {
      console.log('[GUPSHUP_TEST] destination vazio. Defina GUPSHUP_TEST_DESTINATION no .env')
      return
    }

    const params = ['Bruno Favato', '26/12/2025 14:30', 'Unidade Centro', 'Dr. João Silva']

    await SendMessageGupshup({
      agent,
      destination,
      params,
    })
  }
}
