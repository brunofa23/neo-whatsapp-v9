import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import { startAgent } from "../../Services/whatsapp-web/whatsappConnection"
import Chat from 'App/Models/Chat'
import { DateFormat } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'

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
          active: agent.active,
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
      const agent = await Agent.query().where('id', params.id).first()
      //console.log("AGENTE", params.id, "agente", agent)
      console.log("conectando...")
      await startAgent(agent)
      return response.status(201).send('Connected')
    } catch (error) {
      error
    }
  }

  public async connectionAll({ response }: HttpContextContract) {
    try {
      console.log("connection all acionado...")
      const agents = await Agent.query()
      for (const agent of agents) {
        console.log("Conectando agente:", agent.id)
        await startAgent(agent)
      }
      return response.status(201).send('ConnectedAll')
    } catch (error) {
      error
    }
  }





}
