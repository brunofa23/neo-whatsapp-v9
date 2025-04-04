import { OpenAI } from 'openai'
//import stringSimilarity from 'string-similarity'
import { NlpManager } from 'node-nlp'
import Env from '@ioc:Adonis/Core/Env'
import Faq from 'App/Models/Faq'

const openai = new OpenAI({
  apiKey: Env.get('OPENAI_API_KEY'),
})

// cria e treina o NLP dinamicamente com base no FAQ
async function criarGerenciador(perguntas: { ask: string, answer: string }[]) {
  const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

  perguntas.forEach((item, index) => {
    manager.addDocument('pt', item.ask, `pergunta.${index}`)
    manager.addAnswer('pt', `pergunta.${index}`, item.answer)
  })

  await manager.train()
  return manager
}


export async function responderPergunta(perguntaUsuario: string, informationContext: string = ""): Promise<string> {
  const query = await Faq.query().select('ask', 'answer')

  const manager = await criarGerenciador(query)

  const resultado = await manager.process('pt', perguntaUsuario)

  //console.log("INTENÇÃO DETECTADA:", resultado.intent, 'Score:', resultado.score)

  // Se a confiança for alta
  if (resultado.score > 0.75 && resultado.answer) {
    return resultado.answer
  }

  // Se for MUITO baixa
  if (resultado.score < 0.3) {
    return 'Desculpe, não encontrei nenhuma resposta correspondente.'
  }

  // Se for média, sugere uma pergunta parecida (opcional)
  if (resultado.score >= 0.3 && resultado.score < 0.4) {
    const similar = query.find((_, idx) => `pergunta.${idx}` === resultado.intent)
    return `Você quis dizer: "${similar?.ask}"?`
  }

  // Se for média-alta, tenta usar o OpenAI com contexto
  const contexto = query.map((p: any) => `Q: ${p.ask}\nA: ${p.answer}`).join('\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system', content: `Você é uma atendente de call center de um Hospital.
        Responda de forma clara, objetiva e educada.
        Sempre responda em português.` },
      {
        role: 'user', content: `Baseado nas perguntas abaixo responda de forma direta:
        ${contexto} Outras informações:${informationContext} Pergunta: ${perguntaUsuario}`
      },
    ],
    temperature: 0.5,
  })

  console.log(`Baseado nas perguntas abaixo responda de forma direta:
        ${contexto} Outras informações:${informationContext} Pergunta: ${perguntaUsuario}`)

  return completion.choices[0].message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'
}


// export async function responderPergunta(perguntaUsuario: string, informationContext: string = ""): Promise<string> {

//   const query = await Faq.query().select('ask', 'answer')
//   const perguntas = query.map((item) => item.ask)
//   //console.log("passo 1", query)

//   const match = stringSimilarity.findBestMatch(perguntaUsuario, perguntas)
//   console.log("SIMILARIDADE:", match.bestMatch)

//   // Se a similaridade for alta, retorna diretamente a resposta da base
//   if (match.bestMatch.rating > 0.75) {
//     const respostaBase = query.find((p: any) => p.ask === match.bestMatch.target)?.answer
//     return respostaBase
//   }

//   // ✅ SE a similaridade for MUITO baixa (ex: abaixo de 0.4), bloqueia a IA
//   if (match.bestMatch.rating < 0.3) {
//     return 'Desculpe, não encontrei nenhuma resposta correspondente.'
//   }

//   // 👀 Se a similaridade estiver entre 0.3 e 0.4, sugere ao usuário uma pergunta parecida
//   if (match.bestMatch.rating >= 0.3 && match.bestMatch.rating < 0.4) {
//     return `Você quis dizer: "${match.bestMatch.target}"?`
//   }

//   // 🧠 Se a similaridade está no meio-termo (entre 0.4 e 0.75), pode tentar usar a IA com o contexto
//   const contexto = query.map((p: any) => `Q: ${p.ask}\nA: ${p.answer}`).join('\n\n')

//   //console.log("CONTEXTO:", contexto)
//   //const perguntaContexto = `{"address":"AV TITO FULGENCIO, 1000, CID. INDUSTRIAL","medic":"FILA TOPOGRAFIA","schedule":"2023-12-26 07:30"}`
//   const completion = await openai.chat.completions.create({
//     model: 'gpt-3.5-turbo',
//     messages: [
//       {
//         role: 'system', content: `Você é uma atendente de call center de um Hospital.
//         Responda de forma clara, objetiva e educada.
//         Sempre responda em português.` },
//       {
//         role: 'user', content: `Baseado nas perguntas abaixo responda de forma direta:
//         ${contexto} Outras informações:${informationContext} Pergunta: ${perguntaUsuario}`
//       },
//     ],
//     temperature: 0.5,
//   })

//   return completion.choices[0].message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'
// }
