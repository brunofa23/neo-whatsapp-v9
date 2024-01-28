import DatasourcesController from "App/Controllers/Http/DatasourcesController";
import Agent from "App/Models/Agent"
import Config from "App/Models/Config"
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import { DateTime } from 'luxon';

import { DateFormat, GenerateRandomTime, TimeSchedule } from '../app/Services/whatsapp-web/util'
import { startAgentChat } from "../app/Services/whatsapp-web/whatsapp"
import { startAgent } from "../app/Services/whatsapp-web/whatsappConnection"

async function connectionAll() {

  try {
    console.log("connection all acionado...")
    const agents = await Agent.query()
      .where('active', true)

    for (const agent of agents) {
      if (agent) {
        if (agent.default_chat) {
          console.log("Conectando Agente Default")
          await startAgentChat(agent)
        }
        else {
          console.log("Conectando Agente Comum")
          await startAgent(agent)
        }
      }
    }
  } catch (error) {
    error
  }
}

async function sendRepeatedMessage() {
  //console.log("EXECUTANDO BUSCA SMART")
  const executingSendMessage = await Config.find('executingSendMessage')
  setInterval(async () => {
    const date = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    if (!executingSendMessage?.valuebool) {
      if (await TimeSchedule()) {
        console.log(`Buscando dados no Smart(Server): ${date}`)
        await PersistShippingcampaign()
        const datasourcesController = new DatasourcesController
        await datasourcesController.confirmScheduleAll()
        await datasourcesController.cancelScheduleAll()

      }
    }
  }, await GenerateRandomTime(300, 400, '****Send Message Repeated'))

}
async function resetStatusConnected() {
  await Agent.query().update({ status: null, statusconnected: false })
}


module.exports = { connectionAll, sendRepeatedMessage, resetStatusConnected }
