import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import { startAgent } from "../../Services/whatsapp-web/whatsappConnection"
import Chat from 'App/Models/Chat'
import { DateFormat } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'
import { startAgentChat } from "../../Services/whatsapp-web/whatsapp"
import { Client } from 'whatsapp-web.js'

export default class AgentsController {
  public async index({ response }: HttpContextContract) {

    const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
    const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
    try {
      const data = await Agent.query()
      const agents = []
      for (const agent of data) {
        const totMessage =
          await Chat.query()
            .where('chatname', agent.name)
            .andWhereBetween('created_at', [dateStart, dateEnd])
            .count('* as totMessage').first()

        agents.push({
          id: agent.id,
          name: agent.name,
          number_phone: agent.number_phone,
          interval_init_query: agent.interval_init_query,
          interval_final_query: agent.interval_final_query,
          interval_init_message: agent.interval_init_message,
          interval_final_message: agent.interval_final_message,
          max_limit_message: agent.max_limit_message,
          status: agent.status,
          statusconnected: agent.statusconnected,
          qrcode: agent.qrcode,
          totMessage: totMessage?.$extras.totMessage
        })
      }

      //console.log("Agentes", agents)


      return response.status(200).send(agents)
    } catch (error) {
      return error
    }

  }
  public async store({ request, response }: HttpContextContract) {
    const body = request.only(Agent.fillable)
    try {
      const data = await Agent.create(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }

  public async update({ params, request, response }: HttpContextContract) {

    console.log('agent update:', params.id)
    const body = request.only(Agent.fillable)

    try {
      const data = await Agent.query().where('id', params.id)
        .update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }

  public async connection({ params, request, response }: HttpContextContract) {
    try {
      await Agent.query()
        .where('id', params.id)
        .update({ statusconnected: false })

      const agent = await Agent.query().where('id', params.id).first()

      let client
      if (agent) {
        if (agent.default_chat) {
          console.log("agente default")
          client = await startAgentChat(agent)
        }
        else {
          console.log("agente comum")
          client = await startAgent(agent)
        }
      }
      return response.status(201).send('Connected', client)

    } catch (error) {
      error
    }
  }

  // public async connectionAgentChat({ params, request, response }: HttpContextContract) {
  //   try {
  //     await Agent.query()
  //       .where('id', params.id)
  //       .update({ statusconnected: false })
  //     const agent = await Agent.query().where('id', params.id).first()
  //     console.log("conectando agent chat...")
  //     const client = await startAgentChat(agent)
  //     return response.status(201).send("client")
  //   } catch (error) {
  //     error
  //   }
  // }


  // public async sendMessageAgentDefalut() {
  //   const client = global.agentDefault
  //   console.log("CLIENT", client)
  //   if (Object.keys(client).length === 0 || client === null || client === undefined)
  //     return
  //   console.log("Enviando...")
  //   await global.agentDefault.sendMessage('553185228619@c.us', "teste de envio")
  //     .then(async (response) => {
  //       console.log("response>> Mensagem enviada com sucesso!!!", response)
  //     }).catch(async (error) => {
  //       console.log("ERRO 1452:::", error)
  //     })
  // }

  // public async connectionAll({ response }: HttpContextContract) {
  //   try {
  //     console.log("connection all acionado...")
  //     await Agent.query().update({ statusconnected: false })
  //     const agents = await Agent.query()
  //     for (const agent of agents) {
  //       console.log("Conectando agente:", agent.id)
  //       await startAgent(agent)
  //     }
  //     return response.status(201).send('ConnectedAll')
  //   } catch (error) {
  //     error
  //   }
  // }





}
