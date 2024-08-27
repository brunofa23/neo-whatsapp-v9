
export default async (message: string) => {

  if(message.toUpperCase().includes('BOM DIA') || message.toUpperCase().includes('BOA TARDE')||message.toUpperCase().includes('BOA NOITE'))
    return "Bom dia, tudo bem? Sou a Iris, o chatbot do Neo Hospital de Olhos. Para qualquer esclarecimento ligue para 31-32350003. Obrigada!!"
  if(message.toUpperCase().includes('REAGENDAMENTO'))
    return "Gostaria de fazer um reagendamento? Para maiores esclarecimentos ligue para 31-32350003."
  if(message.toUpperCase().includes('CANCELAR'))
    return "Gostaria de cancelar sua consulta? Para maiores esclarecimentos ligue para 31-32350003."
  if(message.toUpperCase().includes('OBRIGADO') || message.toUpperCase().includes('OBRIGADA'))
    return "Imagina, nós que agradecemos!"
  if(message.toUpperCase().includes('TELEFONE ERRADO')||message.toUpperCase().includes('NUMERO ERRADO')||message.toUpperCase().includes('NÚMERO ERRADO') || message.toUpperCase().includes('NÃO SOU EU'))
    return "Desculpe, acredito que houve algum erro em nosso cadastro, iremos corrigir. Obridada!!"


}
