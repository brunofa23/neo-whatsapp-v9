import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import { startAgent } from "../../Services/whatsapp-web/whatsappConnection"

export default class AgentsController {
  public async index({ response }: HttpContextContract) {

    try {
      const data = await Agent.query()
      return response.status(200).send(data)
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
