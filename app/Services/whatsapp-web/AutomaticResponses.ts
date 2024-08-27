
export default async (message: string) => {

  if(message.toUpperCase().includes('BOM DIA'))
    return "Bom dia, tudo bem?"
  if(message.toUpperCase().includes('REAGENDAMENTO'))
    return "Gostaria de fazer um reagendamento?"
  if(message.toUpperCase().includes('CANCELAR'))
    return "Gostaria de cancelar sua consulta?"




}
