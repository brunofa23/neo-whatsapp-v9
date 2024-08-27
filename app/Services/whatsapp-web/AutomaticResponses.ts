
export default async (message: string) => {

  if(message.toUpperCase().includes('BOM DIA'))
    return "Bom dia, tudo bem?"
  if(message.toUpperCase().includes('REAGENDAMENTO'))
    return "Gostaria de fazer um reagendamento?"
  if(message.toUpperCase().includes('CANCELAR'))
    return "Gostaria de cancelar sua consulta?"



  // async function sendMessages() {
  //   if (await TimeSchedule() == false) {
  //     return
  //   }
  //   //const groupChat = client.getChatById('120363170786645695');
  //   //groupChat.sendMessage("teste......");
  //   const phrase = await ListInternalPhrases()

  //   try {
  //       await client.sendMessage('120363170786645695@g.us', phrase)
  //       .then(async (response) => {
  //       }).catch(async (error) => {
  //         console.log("ERRRRO:::", error)
  //       })
  //   }
  //   catch (error) {
  //     console.log("ERRO:::", error)
  //   }
  // }
  // await sendMessages()
}
