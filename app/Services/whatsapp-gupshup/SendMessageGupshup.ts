import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Agent from 'App/Models/Agent'

type SendGupshupTemplateArgs = {
  agent: Agent
  destination: string
  templateId: string
  params: (string | number)[]
}

function onlyDigits(v: string) {
  return String(v || '').replace(/\D/g, '')
}

export default async function SendMessageGupshup({
  agent,
  destination,
  templateId,
  params,
}: SendGupshupTemplateArgs) {
  const apiKey = Env.get('GUPSHUP_API_KEY')
  const url = 'https://api.gupshup.io/wa/api/v1/template/msg'

  if (!agent.gupshup_source) throw new Error(`Agent ${agent.id} sem gupshup_source`)
  if (!agent.gupshup_src_name) throw new Error(`Agent ${agent.id} sem gupshup_src_name`)
  if (!templateId) throw new Error(`templateId não informado`)

  const source = onlyDigits(agent.gupshup_source)
  const dest = onlyDigits(destination)

  const data = new URLSearchParams()
  data.append('channel', 'whatsapp')
  data.append('source', source)
  data.append('destination', dest)
  data.append('src.name', agent.gupshup_src_name)
  data.append(
    'template',
    JSON.stringify({
      id: templateId,
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
