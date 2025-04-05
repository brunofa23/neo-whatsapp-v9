import { NlpManager } from 'node-nlp'

//RECEBE A MENSAGEM E TENTA IDENTIFICAR QUAL A RESPOSTA DO PACIENTE

async function treinarGerenciador() {
  const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

  // Confirmação
  manager.addDocument('pt', 'sim', 'confirmar.consulta')
  manager.addDocument('pt', 'pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'ok', 'confirmar.consulta')
  manager.addDocument('pt', '1', 'confirmar.consulta')

  // Reagendamento / Desmarcar 2
  manager.addDocument('pt', 'não posso neste horário', 'reagendar.consulta')
  manager.addDocument('pt', 'quero reagendar', 'reagendar.consulta')
  manager.addDocument('pt', 'quero desmarcar', 'reagendar.consulta')
  manager.addDocument('pt', '2', 'reagendar.consulta')
  manager.addDocument('pt', 'não confirmar', 'reagendar.consulta')
  manager.addDocument('pt', 'não', 'reagendar.consulta')
  manager.addDocument('pt', 'pode reagendar', 'reagendar.consulta')
  manager.addDocument('pt', 'não vou poder comparecer', 'reagendar.consulta')
  manager.addDocument('pt', 'troquei o dia', 'reagendar.consulta')


  // Recusa retorna 3
  manager.addDocument('pt', 'não sou essa pessoa', 'recusar.consulta')
  manager.addDocument('pt', 'número errado', 'recusar.consulta')
  manager.addDocument('pt', 'não marquei nada', 'recusar.consulta')
  manager.addDocument('pt', 'não poderemos ir', 'reagendar.consulta')
  manager.addDocument('pt', 'esse telefone não pertence', 'recusar.consulta')
  manager.addDocument('pt', 'esse não é o número', 'recusar.consulta')
  manager.addDocument('pt', 'engano', 'recusar.consulta')
  manager.addDocument('pt', 'celular não é dessa pessoa', 'recusar.consulta')

  // Fora de contexto 0
  manager.addDocument('pt', 'oi tudo bem?', 'fora.do.contexto')
  manager.addDocument('pt', 'quem é você?', 'fora.do.contexto')
  manager.addDocument('pt', 'qual é o seu nome?', 'fora.do.contexto')
  manager.addDocument('pt', 'agradece seu contato', 'fora.do.contexto')
  manager.addDocument('pt', 'não posso atender', 'fora.do.contexto')
  manager.addDocument('pt', 'mensagem automatica', 'fora.do.contexto')

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
    return 3//'❌ Ok, vamos cancelar.'
  } else {//FORA DO CONTEXTO
    return 0//'🤔 Desculpe, não entendi sua resposta. Você pode digitar *1* para confirmar ou *2* para reagendar.'
  }
}

