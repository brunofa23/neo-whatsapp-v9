import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import whatsAppEngine from 'App/Services/whatsapp/core/WhatsAppEngine'

export default class WhatsAppEnginesController {
  /**
   * Inicia a sessão de um Agent via Engine (wwebjs ou megaapi)
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

    // 👉 Deixa o Engine escolher o provider com base em agent.provider_type
    await whatsAppEngine.startAgent(agent.id)
    const state = await whatsAppEngine.getState(agent.id)
    const providerKind = await whatsAppEngine.getProviderKind(agent.id)

    console.log(
      `[WhatsAppEngine] startAgent(${agent.id}) provider_type=${agent.provider_type} providerKind=${providerKind}`
    )

    return response.ok({
      message: 'Engine iniciado',
      agent: {
        id: agent.id,
        name: agent.name,
        provider_type: agent.provider_type,
      },
      engine: {
        state,
        provider: providerKind,
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

    await whatsAppEngine.stopAgent(agent.id)
    const state = await whatsAppEngine.getState(agent.id)
    const providerKind = await whatsAppEngine.getProviderKind(agent.id)

    console.log(
      `[WhatsAppEngine] stopAgent(${agent.id}) provider_type=${agent.provider_type} providerKind=${providerKind}`
    )

    return response.ok({
      message: 'Engine parado',
      agent: {
        id: agent.id,
        name: agent.name,
        provider_type: agent.provider_type,
      },
      engine: {
        state,
        provider: providerKind,
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

    const state = await whatsAppEngine.getState(agent.id)
    const providerKind = await whatsAppEngine.getProviderKind(agent.id)

    console.log(
      `[WhatsAppEngineSend] Estado atual agent ${agent.id}: ${state}, providerKind=${providerKind}, provider_type=${agent.provider_type}`
    )

    if (state !== 'CONNECTED' && state !== 'CONNECTED_LOGGEDIN') {
      // você pode ajustar esse nome de estado conforme o que o MegaAPI ou wwebjs retorna
      console.warn(
        `[WhatsAppEngineSend] Agent ${agent.id} não está conectado. state=${state}`
      )
    }

    try {
      const result = await whatsAppEngine.sendText(agent.id, to, text)

      return response.ok({
        message: 'Mensagem enviada via WhatsAppEngine',
        agent: {
          id: agent.id,
          name: agent.name,
          number_phone: agent.number_phone,
          provider_type: agent.provider_type,
        },
        to,
        text,
        provider: providerKind,
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

    const engineState = await whatsAppEngine.getState(agent.id)
    const providerKind = await whatsAppEngine.getProviderKind(agent.id)

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
        provider: providerKind,
      },
    })
  }
}
