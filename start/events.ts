import AgentsController from "App/Controllers/Http/AgentsController";
import DatasourcesController from "App/Controllers/Http/DatasourcesController";
import DatasourceApisController from "App/Controllers/Http/DatasourceApisController";
import Agent from "App/Models/Agent"
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import Shippingcampaign from "App/Models/Shippingcampaign";
import { DateTime } from 'luxon';
import { getTargetDates, GenerateRandomTime, TimeSchedule } from '../app/Services/whatsapp-web/util'
import { startAgentChat } from "../app/Services/whatsapp-web/whatsapp"
import { startAgent } from "../app/Services/whatsapp-web/whatsappConnection"
import '../app/Services/plugins/axios'
import Log from "App/Models/Log";
import Chat from "App/Models/Chat";
import Database from "@ioc:Adonis/Lucid/Database";


async function destroyFullAgents() {
  console.log("Passei no destroy agentes 1222")
  const destroyAgents = new AgentsController
  await destroyAgents.destroyFullAgents()
}

async function connectionAll() {
  try {
    console.log("connection all acionado...")
    await Agent.query().update({ statusconnected: false, qrcode: null })
    const agents = await Agent.query().where('active', true).andWhereNull('deleted').orWhere('deleted', false)

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
      const datasourcesController = new DatasourcesController
      await datasourcesController.confirmScheduleAll()
      await datasourcesController.cancelScheduleAll()

    }
  }, Number(process.env.TIME_SENDREPEATEDMESSAGE || 50000))
}




async function resendMessage() {
  setInterval(async () => {
    try {
      console.log("passei no RESEND............................")
      const now = DateTime.now()
      const yesterdayStart = now.minus({ days: 1 }).startOf('day')
      const yesterdayEnd = now.minus({ days: 1 }).endOf('day')
      const tomorrowStart = now.plus({ days: 1 }).startOf('day')
      const tomorrowEnd = now.plus({ days: 1 }).endOf('day')
      //const yesterdayNoon = now.minus({ days: 1 }).set({ hour: 12, minute: 0, second: 0, millisecond: 0 })


      // 🔹 Atualiza mensagens para reenvio
      const updatedResend = await Shippingcampaign.query()
        .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
        .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
        .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
        .andWhere('interaction_id', 1)
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhereNull('excluded')
        .update({
          createdAt: DateTime.now().toSQL({ includeOffset: false }),
          resend:1
        })

      //BUSCA 40 PACIENTES DO DIA ANTERIOR DE AVALIAÇÃO
      const records = await Shippingcampaign.query()
        .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
        .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
        .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
        .andWhere('interaction_id', 2)
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhereNull('excluded')
        .limit(100) // <-- limita a busca
        .select('id') // só traz os ids para performance
      // pega apenas os ids
      const ids = records.map(r => r.id)
      if (ids.length > 0) {
        await Shippingcampaign.query()
          .whereIn('id', ids)
          .update({
            createdAt: DateTime.now().toSQL({ includeOffset: false }),
            resend:1
          })
      }


      if (updatedResend[0] > 0) {
        await Log.create({
          name: "Resend",
          message: `Reenvio de mensagens não enviadas. Total: ${updatedResend}`,
          description: "Function: resendMessage"
        })
      }

      // 🔹 Atualiza CHATS (pacientes sem resposta)
      // const subquery = Database.from('chats')
      //   .innerJoin('shippingcampaigns', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
      //   .where('shippingcampaigns.created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
      //   .where('shippingcampaigns.created_at', '<=', yesterdayNoon.toSQL({ includeOffset: false }))
      //   .where('shippingcampaigns.interaction_id', 1)
      //   .where('shippingcampaigns.interaction_seq', 1)
      //   .where('chats.returned', 0)
      //   .where('chats.ack', 2)
      //   .select('chats.id')

      //  await Chat.query()
      //   .whereIn('id', Database.from(subquery.as('temp')))
      //   .update({ excluded: 1 })

      // // 🔹 Atualiza SHIPPINGCAMPAIGNS com mesmo filtro
      // const subquery1 = Database
      //   .from('shippingcampaigns as sc')
      //   .innerJoin('chats as c', 'sc.id', 'c.shippingcampaigns_id')
      //   .where('sc.created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
      //   .where('sc.created_at', '<=', yesterdayNoon.toSQL({ includeOffset: false }))
      //   .where('sc.interaction_id', 1)
      //   .where('sc.interaction_seq', 1)
      //   .where('c.returned', 0)
      //   .where('c.ack', 2)
      //   .select('sc.id')

      // const updatedShipping = await Shippingcampaign
      //   .query()
      //   .joinRaw(`JOIN (${subquery1.toQuery()}) as temp on shippingcampaigns.id = temp.id`)
      //   .update({ createdAt: DateTime.now().toSQL({ includeOffset: false }), phonevalid: null, messagesent: 0 })

      // await Log.create({
      //   name: "Resend",
      //   message: `reenvio de mensagens realizado:${updatedShipping}`,
      //   description: "reenvio realizado"
      // })

      // console.log(">>>>update::", updatedShipping)

    } catch (error) {
      console.error("Erro no resendMessage:", error)
      // opcional: registrar no banco
      await Log.create({
        name: "ResendError",
        message: error.message || "Erro desconhecido",
        description: error.stack || "Sem stack trace"
      })
    }
  }, 5 * 60 * 60 * 1000) // 5 horas
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

  }, Number(process.env.TIME_SENDREPEATEDMESSAGE || 5000))


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

export { connectionAll, sendRepeatedMessage, resetStatusConnected, destroyFullAgents, sendRepeatedMessageKlingo, resendMessage }

