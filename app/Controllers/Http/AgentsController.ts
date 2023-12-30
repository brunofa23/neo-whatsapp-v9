import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import { startAgent } from "../../Services/whatsapp-web/whatsappConnection"
import { ConsoleMessage } from 'puppeteer'

export default class AgentsController {


  public async index({ response }: HttpContextContract) {

    console.log('agent store')

    try {
      const data = await Agent.all()
      return response.status(200).send(data)
    } catch (error) {
      return error
    }

  }


  public async store({ request, response }: HttpContextContract) {

    console.log('agent store')
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
      //console.log("AGENTE", agent)
      await startAgent(agent)
      return response.status(201).abort('Connected')
    } catch (error) {
      error
    }
  }


}
