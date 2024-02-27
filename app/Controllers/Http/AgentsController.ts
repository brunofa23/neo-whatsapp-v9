import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import { startAgent } from "../../Services/whatsapp-web/whatsappConnection"
import Chat from 'App/Models/Chat'
import { DateFormat } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'
import { startAgentChat } from "../../Services/whatsapp-web/whatsapp"
import { Client } from 'whatsapp-web.js'
import { Application } from '@adonisjs/core/build/standalone'

const fs = require('fs');




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
          active: agent.active,
          default_chat: agent.default_chat,
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
    body.interval_init_query = 1
    body.interval_final_query = 1
    try {
      const data = await Agent.create(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }

  public async update({ params, request, response }: HttpContextContract) {
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
        .update({ statusconnected: false, qrcode: null })
      const agent = await Agent.query().where('id', params.id).first()
      let client
      if (agent) {
        if (agent.default_chat) {
          console.log(`Conectando Agente Default: ${agent.name}`)
          client = await startAgentChat(agent)
        }
        else {
          console.log(`Conectando Agente Envio: ${agent.name} `)
          client = await startAgent(agent)
        }
      }
      return response.status(201).send('Connected', client)

    } catch (error) {
      error
    }
  }

  public async connectionAll({ params, request, response }: HttpContextContract) {
    try {
      console.log("connection all acionado...")
      await Agent.query().update({ statusconnected: false, qrcode: null })
      const agents = await Agent.query()
        .where('active', true)
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

  public async destroy({ params, request, response }: HttpContextContract) {
    const id = params.id
    const pathFolder = `.wwebjs_auth/session-${id}`
    if (fs.existsSync(pathFolder)) {
      fs.rm(pathFolder, { recursive: true }, (err) => {
        if (err) {
          console.error(err)
        } else {
          console.log("DIRETORIO DELETADO")
        }
      })
    }
    const data = await Agent.findOrFail(id)
    await data.delete()
    return {
      message: "Agente excluido com sucesso!!",
      data: data
    }


  }


}
