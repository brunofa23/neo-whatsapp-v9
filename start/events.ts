import AgentsController from "App/Controllers/Http/AgentsController";
import DatasourcesController from "App/Controllers/Http/DatasourcesController";
import DatasourceApisController from "App/Controllers/Http/DatasourceApisController";
import Agent from "App/Models/Agent"
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import { DateTime } from 'luxon';

import { getTargetDates, GenerateRandomTime, TimeSchedule } from '../app/Services/whatsapp-web/util'
import { startAgentChat } from "../app/Services/whatsapp-web/whatsapp"
import { startAgent } from "../app/Services/whatsapp-web/whatsappConnection"

import '../app/Services/plugins/axios'

async function destroyFullAgents() {
  console.log("Passei no destroy agentes 1222")
  const destroyAgents = new AgentsController
  await destroyAgents.destroyFullAgents()

}

async function connectionAll() {
  try {
    console.log("connection all acionado...")
    await Agent.query().update({ statusconnected: false, qrcode: null })
    const agents = await Agent.query()
      .where('active', true)
      .andWhereNull('deleted')

    for (const agent of agents) {
      if (agent) {
        if (agent.default_chat) {
          console.log(`Conectando Agente Default: ${agent.name} `)
          await startAgentChat(agent)
        }
        else {
          console.log(`Conectando Agente Envio: ${agent.name} `)
          await startAgent(agent)
        }
      }
    }
  } catch (error) {
    error
  }
}

async function sendRepeatedMessage() {
  console.log("EXECUTANDO BUSCA SMART")
  setInterval(async () => {
    const targetDates = getTargetDates()
    if (await TimeSchedule()) {
      for (const date of targetDates) {
        const formatted = date.toFormat('yyyy-MM-dd')
        console.log(`Buscando dados no Smart(Server): ${formatted}`)
        await PersistShippingcampaign(formatted)
      }
      // const datasourcesController = new DatasourcesController
      // await datasourcesController.confirmScheduleAll()
      // await datasourcesController.cancelScheduleAll()

    }
  }, Number(process.env.TIME_SENDREPEATEDMESSAGE || 5000))
}


//BUSCANDO NO KLINGO
async function sendRepeatedMessageKlingo() {
  console.log("EXECUTANDO BUSCA KLINGO")
  setInterval(async () => {
    let date = DateTime.local().setZone('America/Sao_Paulo').plus({ days: 3 });
    if (date.weekday === 6) {
      date = date.plus({ days: 2 }); // Passa para segunda-feira
    } else if (date.weekday === 7) {
      date = date.plus({ days: 1 }); // Passa para segunda-feira
    }
    date = date.toFormat("yyyy-MM-dd");

    if (await TimeSchedule()) {
      console.log(`Buscando dados no Klingo: ${date}`)
      const datasourceApisController = new DatasourceApisController
      datasourceApisController.getSchedulesInternal(date)
    }

  }, await GenerateRandomTime(500, 600, '****Send Message Repeated')
  )

  //Atualiza os confirmados e cancelados
  //console.log("CONFIRM OR CANCEL DESABILITADO ****************")
  setInterval(async () => {
    if (await TimeSchedule()) {
      console.log(`Atualizando confirmações no Klingo: ${DateTime.now().toFormat("dd/MM/yyyy HH:mm")}`)
      const datasourceApisController = new DatasourceApisController
      datasourceApisController.confirmOrCancelScheduleInternal()
    }
  }, await GenerateRandomTime(500, 550, '****Send Message Repeated')
  )



}

async function resetStatusConnected() {
  await Agent.query().update({ status: null, statusconnected: false })
}

export { connectionAll, sendRepeatedMessage, resetStatusConnected, destroyFullAgents, sendRepeatedMessageKlingo }

