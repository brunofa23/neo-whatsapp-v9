import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import { startAgent } from 'App/Services/whatsapp-web/whatsappConnection'
import Chat from 'App/Models/Chat'
import { DateFormat } from 'App/Services/whatsapp-web/util'
import { DateTime } from 'luxon'
import { startAgentChat } from 'App/Services/whatsapp-web/whatsapp'
import Config from 'App/Models/Config'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs'
import WhatsAppClientManager from 'App/Services/whatsapp-web/WhatsAppClientManager'
import whatsAppEngine from 'App/Services/whatsapp/core/WhatsAppEngine'


// Função que retorna uma promessa para remover a pasta
function deleteFolder(pathFolder: string) {
  return new Promise<void>((resolve, reject) => {
    fs.rm(pathFolder, { recursive: true }, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export default class AgentsController {
  public async index({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const dateStart = await DateFormat('yyyy-MM-dd 00:00:00', DateTime.local())
    const dateEnd = await DateFormat('yyyy-MM-dd 23:59:00', DateTime.local())

    try {
      const data = await Agent.query().whereNull('deleted').orWhere('deleted', false)
      const agents: any[] = []

      for (const agent of data) {
        const totMessage =
          await Chat.query()
            .where('chatname', agent.name)
            .andWhereBetween('created_at', [dateStart, dateEnd])
            .count('* as totMessage')
            .first()

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
          company_id: agent.company_id,
          interaction_priority: agent.interaction_priority,
          obs: agent.obs,
          provider_type: agent.provider_type, // 🔹 novo campo vindo do model
          totMessage: (totMessage as any)?.$extras?.totMessage,
        })
      }

      return response.status(200).send(agents)
    } catch (error) {
      return error
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Agent.fillable)

    // defaults
    body.interval_init_query = 1
    body.interval_final_query = 1
    body.active = 1

    // se o front não mandar, defaulta para wwebjs
    if (!body.provider_type) {
      body.provider_type = 'wwebjs'
    }

    try {
      const data = await Agent.create(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Agent.fillable)

    try {
      const data = await Agent.query().where('id', params.id).update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }

  public async connection({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    try {
      const valuedatetime = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      await Config.query().where('id', 'statusSendMessage').update({ valuedatetime })

      const agent = await Agent.query().where('id', params.id).andWhereNull('deleted').first()

      if (!agent) {
        return response.status(404).send({ error: 'Agent não encontrado' })
      }

      // zera status visual
      agent.statusconnected = false
      agent.qrcode = null
      await agent.save()

      // Decide a estratégia conforme provider_type
      let infoConnection: any = null

      if (agent.provider_type === 'wwebjs') {
        console.log(`Conectando Agente via ENGINE (wwebjs): ${agent.name}`)

        await whatsAppEngine.startAgent(agent.id)

        const state = await whatsAppEngine.getState(agent.id)
        infoConnection = { state, provider: whatsAppEngine.getProviderKind() }
      } else {
        // FLUXO LEGADO mantido
        let client
        if (agent.default_chat) {
          console.log(`Conectando Agente Default (LEGACY): ${agent.name}`)
          client = await startAgentChat(agent)
        } else {
          console.log(`Conectando Agente Envio (LEGACY): ${agent.name} `)
          client = await startAgent(agent)
        }

        infoConnection = { legacy: true, state: 'INITIALIZED', client: !!client }
      }

      return response.status(201).send({
        message: 'Conexão iniciada',
        agent: {
          id: agent.id,
          name: agent.name,
          number_phone: agent.number_phone,
          status: agent.status,
          statusconnected: agent.statusconnected,
          provider_type: agent.provider_type,
        },
        connection: infoConnection,
      })
    } catch (error) {
      console.error('[AgentsController.connection] Erro:', error)
      return response.status(500).send({ error: 'Erro ao iniciar conexão', detail: String(error) })
    }
  }


  public async connectionAll({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    try {
      console.log('connectionAll acionado...')

      const valuedatetime = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      await Config.query().where('id', 'statusSendMessage').update({ valuedatetime })

      await Agent.query().whereNull('deleted').update({ statusconnected: false, qrcode: null })

      const agents = await Agent.query().where('active', true)

      const result: any[] = []

      for (const agent of agents) {
        try {
          if (agent.provider_type === 'wwebjs') {
            console.log(`Conectando Agente via ENGINE (wwebjs): ${agent.name}`)
            await whatsAppEngine.startAgent(agent.id)
            const state = await whatsAppEngine.getState(agent.id)

            result.push({
              id: agent.id,
              name: agent.name,
              provider_type: agent.provider_type,
              engineState: state,
            })
          } else {
            // Fluxo legado
            if (agent.default_chat) {
              console.log(`Conectando Agente Default (LEGACY): ${agent.name}`)
              await startAgentChat(agent)
            } else {
              console.log(`Conectando Agente Envio (LEGACY): ${agent.name}`)
              await startAgent(agent)
            }

            result.push({
              id: agent.id,
              name: agent.name,
              provider_type: agent.provider_type || 'legacy',
              engineState: null,
            })
          }
        } catch (err) {
          console.error(`[connectionAll] Erro ao conectar agent ${agent.id}:`, err)
          result.push({
            id: agent.id,
            name: agent.name,
            provider_type: agent.provider_type || 'legacy',
            error: String(err),
          })
        }
      }

      return response.status(200).send({
        message: 'Processo de conexão em lote iniciado',
        agents: result,
      })
    } catch (error) {
      console.error('[AgentsController.connectionAll] Erro geral:', error)
      return response.status(500).send({ error: 'Erro ao conectar todos os agentes', detail: String(error) })
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    console.log('passei no destroy....')

    await new Promise<void>((resolve) => {
      setTimeout(async () => {
        console.log('Excluindo pasta...')
        const pathFolder = Application.tmpPath(`/sessions/session-${params.id}`)

        if (fs.existsSync(pathFolder)) {
          try {
            await deleteFolder(pathFolder)
            console.log(`DIRETÓRIO DELETADO: session-${params.id}`)

            await Agent.query().where('id', params.id).delete()
            resolve()
          } catch (err) {
            console.error(err)
            resolve()
          }
        } else {
          resolve()
        }
      }, 10000)
    })

    const data = await Agent.query()
      .where('id', params.id)
      .update({
        deleted: true,
        active: null,
        status: null,
        number_phone: null,
        qrcode: null,
      })

    return response.status(201).send(data)
  }

  public async destroyFullAgents() {
    const agents = await Agent.query().where('deleted', true)

    for (const agent of agents) {
      await new Promise<void>((resolve) => {
        setTimeout(async () => {
          console.log('Excluindo pasta...')
          const pathFolder = Application.tmpPath(`/sessions/session-${agent.id}`)
          if (fs.existsSync(pathFolder)) {
            try {
              await deleteFolder(pathFolder)
              console.log(`DIRETÓRIO DELETADO: session-${agent.id}`)

              await Agent.query().where('id', agent.id).delete()
              resolve()
            } catch (err) {
              console.error(err)
              resolve()
            }
          } else {
            resolve()
          }
        }, 10000)
      })
    }

    await Agent.query().where('deleted', true).delete()
  }

  public async verifyStatusAgent({ request, response }) {
    const { option, cellphone, agent } = request.only(['option', 'cellphone', 'agent'])
    const client = WhatsAppClientManager.getClient(agent)

    console.log('CLIENTE:', client)
    console.log('Agent recebido:', agent)
    console.log('Todos os clients no manager:', WhatsAppClientManager.getAllClients())
    console.log('option:', option)

    if (!client) {
      return response.status(404).send('Cliente não conectado ou não inicializado')
    }

    if (option == 2) {
      const result = client.info
      return response.send({ retorno: result })
    }

    if (option == 3) {
      const result = await client.getState()
      return response.send({ retorno: result })
    }

    if (option == 4) {
      const result = await client.getContacts()
      return response.send({ retorno: result })
    }

    if (option == 5) {
      const result = await client.getFormattedNumber(`${cellphone}`)
      return response.send({ retorno: result })
    }

    if (option == 6) {
      const result = await client.isRegisteredUser(`${cellphone}@c.us`)
      return response.send({ retorno: result })
    }

    if (option == 7) {
      const result = await client.getContactById(`${cellphone}@c.us`)
      return response.send({ retorno: result })
    }

    if (option == 8) {
      const result = await client.sendMessage(`${cellphone}@c.us`, 'Olá! Esta é uma mensagem automática.')
      return response.send({ retorno: result })
    }

    if (option == 9) {
      const result = await client.sendSeen('31985228619@c.us')
      return response.send({ retorno: result })
    }

    if (option == 10) {
      const result = await client.getChats()
      return response.send({ retorno: result })
    }

    if (option == 11) {
      const result = await client.getChatById(`${cellphone}@c.us`)
      return response.send({ retorno: result })
    }

    if (option == 12) {
      const result = await client.getProfilePicUrl(`${cellphone}@c.us`)
      return response.send({ retorno: result })
    }

    if (option == 13) {
      const result = await client.destroy()
      return response.send({ retorno: result })
    }

    if (option == 14) {
      const result = await client.getWWebVersion()
      return response.send({ retorno: result })
    }

    if (option == 15) {
      const result = await client.logout()
      return response.send({ retorno: result })
    }

    if (option == 16) {
      const result = await client.destroy()
      return response.send({ retorno: result })
    }

    if (option == 17) {
      const result = await client.setDisplayName('Novo Nome')
      return response.send({ retorno: result })
    }

    if (option == 18) {
      const result = await client.setStatus('Disponível para atendimento!')
      return response.send({ retorno: result })
    }

    if (option == 19) {
      const result = await client.initialize()
      return response.send({ retorno: result })
    }

    return response.badRequest({ error: 'Opção inválida' })
  }

  /**
   * 🔹 NOVO: endpoint simples para o front ver status + qrcode
   */
  public async status({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const agent = await Agent.find(params.id)
    if (!agent) {
      return response.notFound({ error: 'Agent não encontrado' })
    }

    return response.ok({
      id: agent.id,
      name: agent.name,
      provider_type: agent.provider_type,
      status: agent.status,
      statusconnected: agent.statusconnected,
      number_phone: agent.number_phone,
      qrcode: agent.qrcode,
    })
  }
}
