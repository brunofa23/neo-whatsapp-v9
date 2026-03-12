import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Agent from 'App/Models/Agent'

type SendGupshupTemplateArgs = {
  agent: Agent
  destination: string
  templateId: string
  params?: (string | number)[]
  useDefaultApiKey?: boolean
  message?: {
    type: string
    document?: {
      link: string
      filename: string
    }
  }
}

function onlyDigits(v: string) {
  return String(v || '').replace(/\D/g, '')
}

export default async function SendMessageGupshup({
  agent,
  destination,
  templateId,
  params,
  useDefaultApiKey = false,
  message,
}: SendGupshupTemplateArgs): Promise<{ status: string; messageId: string }> {
  const apiKey = Env.get(
    useDefaultApiKey ? 'GUPSHUP_API_KEY_DEFAULT' : 'GUPSHUP_API_KEY'
  )

  const url = 'https://api.gupshup.io/wa/api/v1/template/msg'

  if (!apiKey) throw new Error(`GUPSHUP_API_KEY não configurada`)
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

  // ✅ adiciona documento quando existir file_path no shippingCampaign
  if (message) {
    data.append('message', JSON.stringify(message))
  }

  console.log('DEBUG GUPSHUP ENVIANDO >>>', {
    agent: agent.gupshup_src_name,
    templateId,
    params,
    message,
    body: data.toString(),
  })

  const res = await axios.post(url, data, {
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000,
  })

  console.log('RESPOSTA GUPSHUP >>>', res.data)

  const { status, messageId } = res.data || {}

  if (!messageId) {
    throw new Error(`Gupshup: envio sem messageId. Resposta: ${JSON.stringify(res.data)}`)
  }

  return { status: String(status || ''), messageId: String(messageId) }
}
