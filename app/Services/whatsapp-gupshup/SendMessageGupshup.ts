import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Agent from 'App/Models/Agent'

type SendGupshupTemplateArgs = {
  agent: Agent
  destination: string // ex: "5531996509364" (somente dígitos, sem @c.us)
  params: (string | number)[] // ["Bruno Favato","26/12/2025 14:30","Unidade Centro","Dr. João Silva"]
}

function onlyDigits(v: string) {
  return String(v || '').replace(/\D/g, '')
}

export default async function SendMessageGupshup({
  agent,
  destination,
  params,
}: SendGupshupTemplateArgs) {
  const apiKey = Env.get('GUPSHUP_API_KEY')
  const url = 'https://api.gupshup.io/wa/api/v1/template/msg' // igual ao seu curl

  // valida configs do agent
  if (!agent.gupshup_source) throw new Error(`Agent ${agent.id} sem gupshup_source`)
  if (!agent.gupshup_src_name) throw new Error(`Agent ${agent.id} sem gupshup_src_name`)
  if (!agent.gupshup_template_id) throw new Error(`Agent ${agent.id} sem gupshup_template_id`)

  const source = onlyDigits(agent.gupshup_source)
  const dest = onlyDigits(destination)

  if (!source) throw new Error(`Agent ${agent.id} gupshup_source inválido`)
  if (!dest) throw new Error(`destination inválido`)

  const data = new URLSearchParams()
  data.append('channel', 'whatsapp')
  data.append('source', source)
  data.append('destination', dest)
  data.append('src.name', agent.gupshup_src_name)
  data.append(
    'template',
    JSON.stringify({
      id: agent.gupshup_template_id,
      params: (params || []).map((p) => String(p)),
    })
  )

  const res = await axios.post(url, data, {
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000,
  })

  return res.data
}
