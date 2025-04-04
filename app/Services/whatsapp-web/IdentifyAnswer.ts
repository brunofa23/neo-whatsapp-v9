import { NlpManager } from 'node-nlp'


async function treinarGerenciador() {
  const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

  // Confirmação
  manager.addDocument('pt', 'sim', 'confirmar.consulta')
  manager.addDocument('pt', 'pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'ok', 'confirmar.consulta')
  manager.addDocument('pt', '1', 'confirmar.consulta')

  // Reagendamento / Desmarcar
  manager.addDocument('pt', 'não posso neste horário', 'reagendar.consulta')
  manager.addDocument('pt', 'quero reagendar', 'reagendar.consulta')
  manager.addDocument('pt', 'quero desmarcar', 'reagendar.consulta')
  manager.addDocument('pt', '2', 'reagendar.consulta')
  manager.addDocument('pt', 'não confirmar', 'reagendar.consulta')

  // Recusa
  manager.addDocument('pt', 'não sou essa pessoa', 'recusar.consulta')
  manager.addDocument('pt', 'número errado', 'recusar.consulta')
  manager.addDocument('pt', 'não marquei nada', 'recusar.consulta')

  // Fora de contexto
  manager.addDocument('pt', 'oi tudo bem?', 'fora.do.contexto')
  manager.addDocument('pt', 'quem é você?', 'fora.do.contexto')
  manager.addDocument('pt', 'qual é o seu nome?', 'fora.do.contexto')

  // Respostas
  manager.addAnswer('pt', 'confirmar.consulta', 'Consulta confirmada!')
  manager.addAnswer('pt', 'reagendar.consulta', 'Vamos reagendar então.')
  manager.addAnswer('pt', 'recusar.consulta', 'Tudo bem, vamos cancelar.')
  manager.addAnswer('pt', 'fora.do.contexto', 'Desculpe, não entendi. Poderia repetir?')

  await manager.train()
  manager.save()
  return manager
}

export async function interpretAnswer(respostaUsuario: string) {
  const manager = await treinarGerenciador()
  const result = await manager.process('pt', respostaUsuario)

  console.log('Intent:', result.intent)
  console.log('Score:', result.score)
  console.log('Resposta sugerida:', result.answer)

  // Aqui você pode decidir com base na intent
  if (result.intent === 'confirmar.consulta' && result.score > 0.75) {
    return 1//'✅ Consulta confirmada!'
  } else if (result.intent === 'reagendar.consulta') {
    return 2//'📆 Podemos reagendar então.'
  } else if (result.intent === 'recusar.consulta') {
    return 2//'❌ Ok, vamos cancelar.'
  } else {
    return 0//'🤔 Desculpe, não entendi sua resposta. Você pode digitar *1* para confirmar ou *2* para reagendar.'
  }
}

