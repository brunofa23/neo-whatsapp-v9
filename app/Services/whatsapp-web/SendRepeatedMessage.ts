import Agent from 'App/Models/Agent';
import PersistShippingcampaign from './PersistShippingcampaign';
import { getTargetDates, GenerateRandomTime, TimeSchedule } from './util'

async function sendRepeatedMessage(agent: Agent) {
  // setInterval(async () => {
  //   const targetDates = getTargetDates()
  //   //if (!executingSendMessage?.valuebool) {
  //   if (await TimeSchedule()) {
  //     for (const date of targetDates) {
  //       const formatted = date.toFormat('yyyy-MM-dd')
  //       console.log(`Buscando dados no Smart(Server): ${formatted}`)
  //       await PersistShippingcampaign(formatted)
  //     }
  //   }
  //   //}
  // }, await GenerateRandomTime(800, 900, '****Send Message Repeated'))

}



export { sendRepeatedMessage }
