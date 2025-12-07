import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import whatsAppEngine from 'App/Services/whatsapp/core/WhatsAppEngine'

export default class WhatsAppEnginesController {
  /**
   * Inicia a sessão de um Agent via Engine (wwebjs)
   *
   * POST /api/whatsapp/engine/start/:id
   */
  public async start({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const agentId = Number(params.id)
    if (!agentId) {
      return response.badRequest({ error: 'AgentId inválido' })
    }

    const agent = await Agent.find(agentId)
    if (!agent) {
      return response.notFound({ error: 'Agent não encontrado' })
    }

    console.log("passo 1....", agent.provider_type)
    
    if (agent.provider_type !== 'wwebjs') {
      return response.badRequest({
        error: `Agent ${agent.id} não está configurado para provider wwebjs`,
        provider_type: agent.provider_type,
      })
    }

    console.log(`[WhatsAppEngine] startAgent(${agentId}) usando provider: wwebjs`)

    await whatsAppEngine.startAgent(agent.id)
    const state = await whatsAppEngine.getState(agent.id)

    return response.ok({
      message: 'Engine iniciado',
      agent: {
        id: agent.id,
        name: agent.name,
        provider_type: agent.provider_type,
      },
      engine: {
        state,
        provider: whatsAppEngine.getProviderKind(),
      },
    })
  }

  /**
   * Para a sessão de um Agent via Engine
   *
   * POST /api/whatsapp/engine/stop/:id
   */
  public async stop({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const agentId = Number(params.id)
    if (!agentId) {
      return response.badRequest({ error: 'AgentId inválido' })
    }

    const agent = await Agent.find(agentId)
    if (!agent) {
      return response.notFound({ error: 'Agent não encontrado' })
    }

    if (agent.provider_type !== 'wwebjs') {
      return response.badRequest({
        error: `Agent ${agent.id} não está configurado para provider wwebjs`,
        provider_type: agent.provider_type,
      })
    }

    console.log(`[WhatsAppEngine] stopAgent(${agentId})`)

    await whatsAppEngine.stopAgent(agent.id)
    const state = await whatsAppEngine.getState(agent.id)

    return response.ok({
      message: 'Engine parado',
      agent: {
        id: agent.id,
        name: agent.name,
        provider_type: agent.provider_type,
      },
      engine: {
        state,
        provider: whatsAppEngine.getProviderKind(),
      },
    })
  }

  /**
   * Envia uma mensagem de texto via Engine
   *
   * POST /api/whatsapp/engine/send
   * Body:
   * {
   *   "agentId": 505,
   *   "to": "5531999999999" ou "5531999999999@c.us",
   *   "text": "Mensagem..."
   * }
   */
  public async send({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const { agentId, to, text } = request.only(['agentId', 'to', 'text'])

    if (!agentId || !to || !text) {
      return response.badRequest({
        error: 'Campos obrigatórios: agentId, to, text',
      })
    }

    const agent = await Agent.find(agentId)
    if (!agent) {
      return response.notFound({ error: 'Agent não encontrado' })
    }

    if (agent.provider_type !== 'wwebjs') {
      return response.badRequest({
        error: `Agent ${agent.id} não está configurado para provider wwebjs`,
        provider_type: agent.provider_type,
      })
    }

    const state = await whatsAppEngine.getState(agent.id)
    console.log(`[WhatsAppEngineSend] Estado atual agent ${agent.id}:`, state)

    try {
      const result = await whatsAppEngine.sendText(agent.id, to, text)

      return response.ok({
        message: 'Mensagem enviada via WhatsAppEngine',
        agent: {
          id: agent.id,
          name: agent.name,
          number_phone: agent.number_phone,
        },
        to,
        text,
        provider: whatsAppEngine.getProviderKind(),
        engineState: state,
        result,
      })
    } catch (e) {
      console.error('[WhatsAppEngineSend] Erro ao enviar mensagem:', e)
      return response.internalServerError({
        error: 'Erro ao enviar mensagem via engine',
        detail: String(e),
      })
    }
  }

  /**
   * Retorna status do Agent + Engine
   *
   * GET /api/whatsapp/engine/status/:id
   */
  public async status({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const agentId = Number(params.id)
    if (!agentId) {
      return response.badRequest({ error: 'AgentId inválido' })
    }

    const agent = await Agent.find(agentId)
    if (!agent) {
      return response.notFound({ error: 'Agent não encontrado' })
    }

    if (agent.provider_type !== 'wwebjs') {
      return response.badRequest({
        error: `Agent ${agent.id} não está configurado para provider wwebjs`,
        provider_type: agent.provider_type,
      })
    }

    const engineState = await whatsAppEngine.getState(agent.id)

    return response.ok({
      agent: {
        id: agent.id,
        name: agent.name,
        number_phone: agent.number_phone,
        status: agent.status,
        statusconnected: agent.statusconnected,
        provider_type: agent.provider_type,
        qrcode: agent.qrcode,
      },
      engine: {
        state: engineState,
        provider: whatsAppEngine.getProviderKind(),
      },
    })
  }
}
