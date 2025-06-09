import Agent from 'App/Models/Agent';
import PersistShippingcampaign from './PersistShippingcampaign';
import { getTargetDates, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage(agent: Agent) {
  //const executingSendMessage = await Config.find('executingSendMessage')
  // setInterval(async () => {
  //   //const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
  //   const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local().setZone('America/Sao_Paulo'))

  //   if (!executingSendMessage?.valuebool) {
  //     if (await TimeSchedule()) {
  //       console.log(`Buscando dados no Smart: ${date}`)
  //       await PersistShippingcampaign(date)
  //     }
  //   }
  // }, await GenerateRandomTime(500, 800, '****Send Message Repeated'))
  setInterval(async () => {
    const targetDates = getTargetDates()
    //if (!executingSendMessage?.valuebool) {
    if (await TimeSchedule()) {
      for (const date of targetDates) {
        const formatted = date.toFormat('yyyy-MM-dd')
        console.log(`Buscando dados no Smart(Server): ${formatted}`)
        await PersistShippingcampaign(formatted)
      }
    }
    //}
  }, await GenerateRandomTime(300, 400, '****Send Message Repeated'))

}



export { sendRepeatedMessage }
