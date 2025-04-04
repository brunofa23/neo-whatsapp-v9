import fs from 'fs'
import { OpenAI } from 'openai'
import stringSimilarity from 'string-similarity'
import Env from '@ioc:Adonis/Core/Env'
import Application from '@ioc:Adonis/Core/Application'
import Faq from 'App/Models/Faq'

const openai = new OpenAI({
  apiKey: Env.get('OPENAI_API_KEY'),
})

//const path = Application.makePath('app/Services/Ai/faq.json')

export async function responderPergunta(perguntaUsuario: string, informationContext:string =""): Promise<string> {

  const query = await Faq.query().select('ask', 'answer')
  const perguntas = query.map((item) => item.ask)
  console.log("passo 1", query)

  const match = stringSimilarity.findBestMatch(perguntaUsuario, perguntas)
  console.log("SIMILARIDADE:", match.bestMatch)

  // Se a similaridade for alta, retorna diretamente a resposta da base
  if (match.bestMatch.rating > 0.75) {
    const respostaBase = query.find((p: any) => p.ask === match.bestMatch.target)?.answer
    return respostaBase
  }

  // ✅ SE a similaridade for MUITO baixa (ex: abaixo de 0.4), bloqueia a IA
  if (match.bestMatch.rating < 0.4) {
    return 'Desculpe, não encontrei nenhuma resposta correspondente.'
  }

  // 🧠 Se a similaridade está no meio-termo (entre 0.4 e 0.75), pode tentar usar a IA com o contexto
  const contexto = query.map((p: any) => `Q: ${p.ask}\nA: ${p.answer}`).join('\n\n')

  //console.log("CONTEXTO:", contexto)
  //const perguntaContexto = `{"address":"AV TITO FULGENCIO, 1000, CID. INDUSTRIAL","medic":"FILA TOPOGRAFIA","schedule":"2023-12-26 07:30"}`
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system', content: `Você é uma atendente de call center de um Hospital.
        Responda de forma clara, objetiva e educada.
        Exemplo: "Seu atendimento está agendado na AV. MARECHAL CASTELO BRANCO com o Dr. José".
        Se não souber, diga: "Desculpe, não encontrei essa informação."
        Sempre responda em português.` },
      {
        role: 'user', content: `Baseado nas perguntas abaixo responda de forma direta:
        ${contexto} ${informationContext} Pergunta: ${perguntaUsuario}`
      },
    ],
    temperature: 0.5,
  })

  return completion.choices[0].message?.content?.trim() || 'Desculpe, não entendi sua pergunta.'
}
