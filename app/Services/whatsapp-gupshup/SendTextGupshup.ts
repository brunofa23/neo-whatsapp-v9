import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'

function onlyDigits(v: string) {
  return String(v || '').replace(/\D/g, '')
}

type SendTextArgs = {
  source: string        // seu número WABA (ex: 553199740981)
  destination: string   // número do paciente
  text: string
}

export default async function SendTextGupshup({ source, destination, text }: SendTextArgs) {
  const apiKey = Env.get('GUPSHUP_API_KEY')
  const url = 'https://api.gupshup.io/wa/api/v1/msg'

  const data = new URLSearchParams()
  data.append('channel', 'whatsapp')
  data.append('source', onlyDigits(source))
  data.append('destination', onlyDigits(destination))
  data.append('message', JSON.stringify({ type: 'text', text: String(text || '') }))

  const res = await axios.post(url, data, {
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 30000,
  })

  return res.data
}
