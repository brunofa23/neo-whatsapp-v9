import { NlpManager } from 'node-nlp'
import stringSimilarity from 'string-similarity'
import Env from '@ioc:Adonis/Core/Env'
import Faq from 'App/Models/Faq'
import axios from 'axios'
import { OpenAI } from 'openai'

// Instância OpenAI (caso esteja usando diretamente)
const openai = new OpenAI({
  apiKey: Env.get('OPENAI_API_KEY'),
})

// Função para treinar NLP
async function criarGerenciador(perguntas: { ask: string; answer: string }[]) {
  const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

  perguntas.forEach((item, index) => {
    manager.addDocument('pt', item.ask, `pergunta.${index}`)
    manager.addAnswer('pt', `pergunta.${index}`, item.answer)
  })

  await manager.train()
  return manager
}

// Função genérica para fallback com IA (OpenAI ou OpenRouter)
async function fallbackParaIA(
  perguntaUsuario: string,
  perguntas: { ask: string; answer: string }[],
  informationContext: string
): Promise<string> {
  const contexto = perguntas.map((p) => `Q: ${p.ask}\nA: ${p.answer}`).join('\n\n')

  const messages = [
    {
      role: 'system',
      content: `Você é uma atendente de call center de um hospital e só pode responder com base nas perguntas e respostas abaixo.
      Se a pergunta do usuário não estiver claramente presente ou relacionada diga "Desculpe, não tenho essa resposta".
      Responda de forma clara, objetiva e educada.
      Sempre responda em português.`,
    },
    {
      role: 'user',
      content: `Baseado nas perguntas abaixo, responda de forma direta:

${contexto}

Informações adicionais do paciente: ${informationContext}

Pergunta: ${perguntaUsuario}`,
    },
  ]

  // Alternar entre OpenAI e OpenRouter via ENV
  if (Env.get('USE_OPENROUTER') === 'true') {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: Env.get('OPENROUTER_MODEL', 'openai/gpt-3.5-turbo'),
        messages,
        temperature: 0.5,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${Env.get('OPENROUTER_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'
  } else {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.5,
      max_tokens: 500,
    })

    return completion.choices[0].message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'
  }
}

// Função principal
export async function responderPergunta(
  perguntaUsuario: string,
  informationContext: string = ''
): Promise<string> {
  const query = await Faq.query().select('ask', 'answer')
  const perguntas = query.map((item) => item.ask)

  const manager = await criarGerenciador(query)
  const resultado = await manager.process('pt', perguntaUsuario)

  // Verifica similaridade real
  const match = stringSimilarity.findBestMatch(perguntaUsuario, perguntas)
  const similaridade = match.bestMatch.rating
  const perguntaMaisParecida = match.bestMatch.target
  const indexMaisParecido = perguntas.findIndex((p) => p === perguntaMaisParecida)
  const respostaMaisParecida = query[indexMaisParecido]?.answer

  console.log('Score NLP:', resultado.score)
  console.log('Similaridade:', similaridade)
  console.log('Pergunta mais parecida:', perguntaMaisParecida)

  if (similaridade >= 0.6 && respostaMaisParecida) {
    return respostaMaisParecida
  }

  // Se a similaridade for baixa, usamos fallback IA
  return await fallbackParaIA(perguntaUsuario, query, informationContext)
}
