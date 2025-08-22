import { NlpManager } from 'node-nlp'
import stringSimilarity from 'string-similarity'
import Env from '@ioc:Adonis/Core/Env'
import Faq from 'App/Models/Faq'
import axios from 'axios'
import { OpenAI } from 'openai'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'

// Instância OpenAI
const openai = new OpenAI({
  apiKey: Env.get('OPENAI_API_KEY'),
})

async function criarGerenciador(perguntas: { ask: string; answer: string }[]) {
  const modelPath = Application.makePath(`app/Services/Ai/model.nlp`)
  const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

  if (fs.existsSync(modelPath)) {
    await manager.load(modelPath)
    return manager
  }

  perguntas.forEach((item, index) => {
    manager.addDocument('pt', item.ask, `pergunta.${index}`)
    manager.addAnswer('pt', `pergunta.${index}`, item.answer)
  })

  await manager.train()
  await manager.save(modelPath)

  return manager
}

// Fallback com IA
// async function fallbackParaIA(
//   perguntaUsuario: string,
//   perguntas: { ask: string; answer: string }[],
//   informationContext: string
// ): Promise<string> {
//   try {
//     const similaridades = perguntas.map((item) => ({
//       pergunta: item.ask,
//       resposta: item.answer,
//       score: stringSimilarity.compareTwoStrings(perguntaUsuario, item.ask),
//     }))

//     const topSimilares = similaridades
//       .sort((a, b) => b.score - a.score)
//       .slice(0, 1)

//     const contexto = topSimilares
//       .map((p) => `Q: ${p.pergunta}\nA: ${p.resposta}`)
//       .join('\n\n')

//     const messages = [
//       {
//         role: 'system',
//         content: `Você é um bot de call center de um hospital chamada Iris, e só pode responder com base nas perguntas e respostas abaixo.
// Se a pergunta do usuário não estiver claramente presente ou relacionada diga "Desculpe, não tenho essa resposta, melhor ligar para a nossa central.".
// Se alguém te tratar de forma hostil ou com palavras indevidas diga "Desculpe, sou apenas uma máquina e ainda estou aprendendo!".
// Nunca confirme uma marcação ou cancelamento de agendamento.
// Nunca combine respostas de diferentes tópicos. Não crie ou assuma informações.
// Responda de forma clara, objetiva e educada.
// Se tiver o nome chame-o apenas pelo primeiro nome.
// Sempre responda em português.`,
//       },
//       {
//         role: 'user',
//         content: `Baseado nas perguntas abaixo, responda de forma direta:
// ${contexto}
// Informações adicionais do paciente: ${informationContext}
// Pergunta: ${perguntaUsuario}`,
//       },
//     ]

//     const response = await axios.post(
//       'https://api.groq.com/openai/v1/chat/completions',
//       {
//         model: 'llama-3.1-8b-instant',
//         messages,
//         temperature: 0.5,
//         max_tokens: 500,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${Env.get('GROQ_API_KEY')}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     )

//     return response.data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'

//   } catch (error) {
//     console.error('Erro no fallback com IA:', error)
//     return 'Desculpe, houve um erro ao tentar entender sua pergunta.'
//   }
// }

// Fallback com IA (Groq)
async function fallbackParaIA(
  perguntaUsuario: string,
  perguntas: { ask: string; answer: string }[],
  informationContext: string
): Promise<string> {
  try {
    // calcula similaridades
    const similaridades = perguntas.map((item) => ({
      pergunta: item.ask,
      resposta: item.answer,
      score: stringSimilarity.compareTwoStrings(perguntaUsuario, item.ask),
    }))

    const topSimilares = similaridades
      .sort((a, b) => b.score - a.score)
      .slice(0, 1)

    // se não há nada parecido o suficiente, nem chama a IA
    if (topSimilares.length === 0 || topSimilares[0].score < 0.5) {
      return 'Desculpe, não tenho essa resposta, melhor ligar para a nossa central.'
    }

    const contexto = topSimilares
      .map((p) => `Q: ${p.pergunta}\nA: ${p.resposta}`)
      .join('\n\n')

    const messages = [
      {
        role: 'system',
        content: `Você é um bot de call center de um hospital chamada Iris.
Você deve responder **EXCLUSIVAMENTE** com base nas perguntas e respostas abaixo.
⚠️ IMPORTANTE:
- Se a pergunta do usuário não estiver claramente presente ou relacionada ao contexto, responda exatamente:
"Desculpe, não tenho essa resposta, melhor ligar para a nossa central."
- Nunca invente ou assuma informações que não estejam no contexto.
- Nunca confirme marcações, reagendamentos ou cancelamentos.
- Nunca combine respostas de diferentes tópicos.
- Se alguém for hostil, diga: "Desculpe, sou apenas uma máquina e ainda estou aprendendo!".
Responda sempre de forma clara, objetiva, educada e em português.`,
      },
      {
        role: 'user',
        content: `Baseado apenas nas perguntas abaixo, responda de forma direta:
${contexto}

Informações adicionais do paciente: ${informationContext}

Pergunta: ${perguntaUsuario}`,
      },
    ]

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0, // <- reduz criatividade
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${Env.get('GROQ_API_KEY')}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return (
      response.data.choices?.[0]?.message?.content?.trim() ||
      'Desculpe, não tenho essa resposta, melhor ligar para a nossa central.'
    )
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

  const match = stringSimilarity.findBestMatch(perguntaUsuario, perguntas)
  const similaridade = match.bestMatch.rating
  const perguntaMaisParecida = match.bestMatch.target
  const indexMaisParecido = perguntas.findIndex((p) => p === perguntaMaisParecida)
  const respostaMaisParecida = query[indexMaisParecido]?.answer

  if (similaridade >= 0.8 && respostaMaisParecida) {
    return respostaMaisParecida
  }

  return await fallbackParaIA(perguntaUsuario, query, informationContext)
}
