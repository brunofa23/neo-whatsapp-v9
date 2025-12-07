import { Client } from 'whatsapp-web.js'
import Agent from 'App/Models/Agent'
import ListInternalPhrases from './ListInternalPhrases'
import { TimeSchedule } from './util'

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function toCUsJid(phone: string) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits ? `${digits}@c.us` : null
}

export default async (client: Client) => {
  console.log('PASSEI NO GRUPO SEND MESSAGE GRUPO')

  const groupId = process.env.INTERNAL_GROUP_ID
  if (!groupId || !groupId.endsWith('@g.us')) {
    console.log('INTERNAL_GROUP_ID inválido. Ex: 120363170786645695@g.us')
    return
  }

  if ((await TimeSchedule()) === false) return

  try {
    const state = await client.getState().catch(() => null)
    if (!state) {
      console.log('Cliente do WhatsApp desconectado ou inválido.')
      return
    }

    const phrase = await ListInternalPhrases()

    // ✅ 1) sempre manda no grupo
    await client.sendMessage(groupId, phrase)

    // ✅ 2) opcional: DM para um agent aleatório do BANCO (sem .env)
    // Ajuste aqui a chance como quiser (ex: 0.3 = 30%)
    const DM_CHANCE = 0.3
    if (Math.random() > DM_CHANCE) return

    const myNumber = String(client.info?.wid?.user || '').replace(/\D/g, '')

    const agents = await Agent.query()
      .select(['id', 'name', 'number_phone'])
      .where('active', true)
      .where((q) => q.whereNull('deleted').orWhere('deleted', false))
      .whereNotNull('number_phone')

    const candidates = agents
      .map((a) => ({
        id: a.id,
        name: a.name,
        jid: toCUsJid((a as any).number_phone),
      }))
      .filter((a) => a.jid && !a.jid.startsWith(myNumber + '@'))

    if (candidates.length === 0) return

    const chosen = pickRandom(candidates)
    await client.sendMessage(chosen.jid!, phrase)
    console.log(`DM interna enviada para agent ${chosen.id} (${chosen.name}) => ${chosen.jid}`)
  } catch (error: any) {
    console.log('Erro ao enviar mensagem:', error?.message || error)
  }
}


// import { Client } from 'whatsapp-web.js'
// import ListInternalPhrases from './ListInternalPhrases'
// import { TimeSchedule } from './util'

// export default async (client: Client) => {
//   console.log("PASSEI NO GRUPO SEND MESSAGE GRUPO")
//   // ✅ lê o grupo do .env
//   const groupId = process.env.INTERNAL_GROUP_ID

//   if (!groupId || !groupId.endsWith('@g.us')) {
//     console.log('INTERNAL_GROUP_ID inválido. Ex: 120363170786645695@g.us')
//     return
//   }

//   if ((await TimeSchedule()) === false) return

//   try {
//     // ✅ valida conexão (mais confiável que pupBrowser)
//     const state = await client.getState().catch(() => null)
//     if (!state) {
//       console.log('Cliente do WhatsApp desconectado ou inválido.')
//       return
//     }

//     const phrase = await ListInternalPhrases()
//     await client.sendMessage(groupId, phrase)
//   } catch (error: any) {
//     console.log('Erro ao enviar mensagem:', error?.message || error)
//   }
// }
