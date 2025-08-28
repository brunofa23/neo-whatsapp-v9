import { NlpManager } from 'node-nlp'

//RECEBE A MENSAGEM E TENTA IDENTIFICAR QUAL A RESPOSTA DO PACIENTE

async function treinarGerenciador() {
  const manager = new NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } })

  // Confirmação 1
  manager.addDocument('pt', 'sim', 'confirmar.consulta')
  manager.addDocument('pt', 'pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'ok', 'confirmar.consulta')
  manager.addDocument('pt', '1', 'confirmar.consulta')
  manager.addDocument('pt', 'confirmado', 'confirmar.consulta')
  manager.addDocument('pt', 'sim, confirmado', 'confirmar.consulta')
  manager.addDocument('pt', 'confirmadíssimo', 'confirmar.consulta')
  // Cumprimentos + Confirmação
  manager.addDocument('pt', 'bom dia, confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'bom dia, 1', 'confirmar.consulta')
  manager.addDocument('pt', 'bom dia, confirmado', 'confirmar.consulta')
  manager.addDocument('pt', 'bom dia, pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'bom dia, sim', 'confirmar.consulta')
  manager.addDocument('pt', 'bom dia, ok', 'confirmar.consulta')

  manager.addDocument('pt', 'boa tarde, 1', 'confirmar.consulta')
  manager.addDocument('pt', 'boa tarde, confirmado', 'confirmar.consulta')
  manager.addDocument('pt', 'boa tarde, pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'boa tarde, sim', 'confirmar.consulta')
  manager.addDocument('pt', 'boa tarde, ok', 'confirmar.consulta')

  manager.addDocument('pt', 'boa noite, 1', 'confirmar.consulta')
  manager.addDocument('pt', 'boa noite, confirmado', 'confirmar.consulta')
  manager.addDocument('pt', 'boa noite, pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'boa noite, sim', 'confirmar.consulta')
  manager.addDocument('pt', 'boa noite, ok', 'confirmar.consulta')

  manager.addDocument('pt', 'olá, confirmado', 'confirmar.consulta')
  manager.addDocument('pt', 'olá, sim', 'confirmar.consulta')
  manager.addDocument('pt', 'olá, pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'olá, ok', 'confirmar.consulta')

  manager.addDocument('pt', 'oi, confirmado', 'confirmar.consulta')
  manager.addDocument('pt', 'oi, sim', 'confirmar.consulta')
  manager.addDocument('pt', 'oi, pode confirmar', 'confirmar.consulta')
  manager.addDocument('pt', 'oi, ok', 'confirmar.consulta')


  // Reagendamento / Desmarcar 2
  manager.addDocument('pt', 'não posso neste horário', 'reagendar.consulta')
  manager.addDocument('pt', 'quero desmarcar', 'reagendar.consulta')
  manager.addDocument('pt', '2', 'reagendar.consulta')
  manager.addDocument('pt', 'não confirmar', 'reagendar.consulta')
  manager.addDocument('pt', 'não', 'reagendar.consulta')
  manager.addDocument('pt', 'não vou poder comparecer', 'reagendar.consulta')
  manager.addDocument('pt', 'não poderemos ir', 'reagendar.consulta')
  manager.addDocument('pt', 'cancelar', 'reagendar.consulta')
  manager.addDocument('pt', 'não, cancelar', 'reagendar.consulta')
  manager.addDocument('pt', 'pode cancelar', 'reagendar.consulta')
  manager.addDocument('pt', 'não poderei ir', 'reagendar.consulta')
  manager.addDocument('pt', 'não vou poder ir nesse dia', 'reagendar.consulta')
  manager.addDocument('pt', 'desculpe, não posso', 'reagendar.consulta')

  // Recusa 3
  manager.addDocument('pt', 'não sou essa pessoa', 'recusar.consulta')
  manager.addDocument('pt', 'número errado', 'recusar.consulta')
  manager.addDocument('pt', 'não marquei nada', 'recusar.consulta')
  manager.addDocument('pt', 'esse telefone não pertence', 'recusar.consulta')
  manager.addDocument('pt', 'esse não é o número', 'recusar.consulta')
  manager.addDocument('pt', 'engano', 'recusar.consulta')
  manager.addDocument('pt', 'celular não é dessa pessoa', 'recusar.consulta')
  manager.addDocument('pt', 'esse contato não é do', 'recusar.consulta')

  // Fora de contexto 0
  manager.addDocument('pt', 'quem é você?', 'fora.do.contexto')
  manager.addDocument('pt', 'qual é o seu nome?', 'fora.do.contexto')
  manager.addDocument('pt', 'agradece seu contato', 'fora.do.contexto')
  manager.addDocument('pt', 'não posso atender', 'fora.do.contexto')
  manager.addDocument('pt', 'mensagem automatica', 'fora.do.contexto')
  manager.addDocument('pt', 'tem outro horário', 'fora.do.contexto')
  manager.addDocument('pt', 'quero reagendar', 'fora.do.contexto')

  // Cumprimento 5
  manager.addDocument('pt', 'oi tudo bem?', 'cumprimento')
  manager.addDocument('pt', 'bom dia', 'cumprimento')
  manager.addDocument('pt', 'boa tarde', 'cumprimento')
  manager.addDocument('pt', 'boa noite', 'cumprimento')
  manager.addDocument('pt', 'olá', 'cumprimento')
  manager.addDocument('pt', 'oi', 'cumprimento')

  // Respostas
  manager.addAnswer('pt', 'confirmar.consulta', 'Consulta confirmada!')
  manager.addAnswer('pt', 'reagendar.consulta', 'Vamos reagendar então.')
  manager.addAnswer('pt', 'recusar.consulta', 'Tudo bem, vamos cancelar.')
  manager.addAnswer('pt', 'fora.do.contexto', 'Desculpe, não entendi. Poderia repetir?')
  manager.addAnswer('pt', 'cumprimento', 'Olá! 👋 Como posso ajudar?')

  await manager.train()
  manager.save()
  return manager
}

export async function interpretAnswer(respostaUsuario: string) {
  const manager = await treinarGerenciador()
  const result = await manager.process('pt', respostaUsuario)

  // thresholds por intent
  const thresholds: Record<string, number> = {
    'confirmar.consulta': 0.75,
    'reagendar.consulta': 0.95,
    'recusar.consulta': 0.85,
    'fora.do.contexto': 0.5,
    'cumprimento': 0.6,
  }

  const minScore = thresholds[result.intent] || 0.8

  if (result.score < minScore) {
    return { code: 0, resposta: '🤔 Desculpe, não entendi sua resposta. Você pode digitar *1* para confirmar ou *2* para reagendar.' }
  }

  switch (result.intent) {
    case 'confirmar.consulta':
      return { code: 1, resposta: '✅ Consulta confirmada!' }
    case 'reagendar.consulta':
      return { code: 2, resposta: '📆 Iremos Cancelar.' }
    case 'recusar.consulta':
      return { code: 3, resposta: '❌ Ok, vamos corrigir nosso cadastro.' }
    case 'cumprimento':
      return { code: 5, resposta: '👋 Olá! Como posso ajudar?' }
    case 'fora.do.contexto':
    default:
      return { code: 0, resposta: '🤔 Desculpe, não entendi sua resposta. Você pode digitar *1* para confirmar ou *2* para reagendar.' }
  }
}
