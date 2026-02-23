import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Agent from 'App/Models/Agent'

type SendGupshupTemplateArgs = {
  agent: Agent
  destination: string
  templateId: string
  params?: (string | number)[]  // 🔹 opcional
  useDefaultApiKey?: boolean    // 🔹 boolean opcional, não "false"
}

function onlyDigits(v: string) {
  return String(v || '').replace(/\D/g, '')
}

export default async function SendMessageGupshup({
  agent,
  destination,
  templateId,
  params,
  useDefaultApiKey = false, // 🔹 default = false aqui
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


  // 👇 AQUI: antes do axios.post
  console.log('DEBUG GUPSHUP ENVIANDO >>>', {
    templateId,
    params,
    body: data.toString(),   // opcional, pra ver o payload inteiro
  })

  const res = await axios.post(url, data, {
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000,
  })

  console.log('RESPOSTA GUPSHUP >>>', res.data) // 👈 adiciona isso


  const { status, messageId } = res.data || {}

  if (!messageId) {
    throw new Error(`Gupshup: envio sem messageId. Resposta: ${JSON.stringify(res.data)}`)
  }

  return { status: String(status || ''), messageId: String(messageId) }
}
