import { NlpManager } from 'node-nlp'
import stringSimilarity from 'string-similarity'
import Env from '@ioc:Adonis/Core/Env'
import Faq from 'App/Models/Faq'
import axios from 'axios'
import { OpenAI } from 'openai'

import fs from 'fs'
import path from 'path'

// Instância OpenAI
const openai = new OpenAI({
  apiKey: Env.get('OPENAI_API_KEY'),
})

// // Função para treinar NLP
// async function criarGerenciador(perguntas: { ask: string; answer: string }[]) {
//   const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

//   perguntas.forEach((item, index) => {
//     manager.addDocument('pt', item.ask, `pergunta.${index}`)
//     manager.addAnswer('pt', `pergunta.${index}`, item.answer)
//   })

//   await manager.train()
//   return manager
// }
async function criarGerenciador(perguntas: { ask: string; answer: string }[]) {
  const modelPath = path.resolve(__dirname, '../../nlp/model.nlp')
  const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

  // Se o modelo já existe, carregue ele da memória
  if (fs.existsSync(modelPath)) {
    await manager.load(modelPath)
    return manager
  }

  // Caso contrário, treina com as perguntas atuais
  perguntas.forEach((item, index) => {
    manager.addDocument('pt', item.ask, `pergunta.${index}`)
    manager.addAnswer('pt', `pergunta.${index}`, item.answer)
  })

  await manager.train()
  await manager.save(modelPath)

  return manager
}

// Fallback com IA
async function fallbackParaIA(
  perguntaUsuario: string,
  perguntas: { ask: string; answer: string }[],
  informationContext: string
): Promise<string> {
  try {
    const contexto = perguntas.map((p) => `Q: ${p.ask}\nA: ${p.answer}`).join('\n\n')

    const messages = [
      {
        role: 'system',
        content: `Você é uma atendente de call center de um hospital e só pode responder com base nas perguntas e respostas abaixo.
Se a pergunta do usuário não estiver claramente presente ou relacionada diga "Desculpe, não tenho essa resposta".
Responda de forma clara, objetiva e educada.
Se tiver o nome chame-o apenas pelo primeiro nome.
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


    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192',
        messages,
        temperature: 0.5,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${Env.get('GROQ_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'

    // if (Env.get('USE_OPENROUTER') === 'true') {
    //   const response = await axios.post(
    //     'https://openrouter.ai/api/v1/chat/completions',
    //     {
    //       model: Env.get('OPENROUTER_MODEL', 'openai/gpt-3.5-turbo'),
    //       messages,
    //       temperature: 0.5,
    //       max_tokens: 500,
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${Env.get('OPENROUTER_API_KEY')}`,
    //         'Content-Type': 'application/json',
    //       },
    //     }
    //   )

    //   return response.data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'
    // } else {
    //   const completion = await openai.chat.completions.create({
    //     model: 'gpt-3.5-turbo',
    //     messages,
    //     temperature: 0.5,
    //     max_tokens: 500,
    //   })

    //   return completion.choices[0].message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'
    // }
  } catch (error) {
    console.error('Erro no fallback com IA:', error)
    return 'Desculpe, houve um erro ao tentar entender sua pergunta.'
  }
}

// Função principal
export async function responderPergunta(
  perguntaUsuario: string,
  informationContext: string = ''
): Promise<string> {
  let query: { ask: string; answer: string }[] = []

  try {
    query = await Faq.query().select('ask', 'answer')
  } catch (error) {
    console.error('Erro ao consultar FAQs:', error)
    return 'Desculpe, houve um erro ao buscar as perguntas frequentes.'
  }

  const perguntas = query.map((item) => item.ask)

  let manager
  try {
    manager = await criarGerenciador(query)
  } catch (error) {
    console.error('Erro ao treinar NLP:', error)
    return 'Desculpe, não consegui processar sua pergunta no momento.'
  }

  let resultado
  try {
    resultado = await manager.process('pt', perguntaUsuario)
  } catch (error) {
    console.error('Erro ao processar pergunta com NLP:', error)
    return 'Desculpe, houve um erro ao tentar entender sua pergunta.'
  }

  // Verifica similaridade
  const match = stringSimilarity.findBestMatch(perguntaUsuario, perguntas)
  const similaridade = match.bestMatch.rating
  const perguntaMaisParecida = match.bestMatch.target
  const indexMaisParecido = perguntas.findIndex((p) => p === perguntaMaisParecida)
  const respostaMaisParecida = query[indexMaisParecido]?.answer

  if (similaridade >= 0.6 && respostaMaisParecida) {
    return respostaMaisParecida
  }

  // Fallback com IA se não houver resposta satisfatória
  return await fallbackParaIA(perguntaUsuario, query, informationContext)
}
