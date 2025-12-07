import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import whatsAppEngine from 'App/Services/whatsapp/core/WhatsAppEngine'

export default class WhatsAppEngineTestsController {
  /**
   * Inicia a sessão de um agent usando o WhatsAppEngine.
   *
   * Rota sugerida:
   *   POST /api/whatsapp/engine/start/:id
   */
  public async start({ auth, params, response }: HttpContextContract) {
    // autentica via guard "api"
    //await auth.use('api').authenticate()

    const id = Number(params.id)
    if (!id) {
      return response.badRequest({ error: 'Parâmetro :id inválido' })
    }

    const agent = await Agent.find(id)
    if (!agent) {
      return response.notFound({ error: 'Agent não encontrado' })
    }

    // 👉 apenas inicia o agent; NÃO chamamos getState aqui
    await whatsAppEngine.startAgent(agent.id)

    return response.ok({
      message: 'WhatsAppEngine INICIANDO para o agent (veja os logs do servidor)',
      agent: {
        id: agent.id,
        name: agent.name,
        number_phone: agent.number_phone,
      },
      provider: whatsAppEngine.getProviderKind(),
    })
  }

  /**
   * Para/desconecta a sessão de um agent pelo WhatsAppEngine.
   *
   * Rota sugerida:
   *   POST /api/whatsapp/engine/stop/:id
   */
  public async stop({ auth, params, response }: HttpContextContract) {
    //await auth.use('api').authenticate()

    const id = Number(params.id)
    if (!id) {
      return response.badRequest({ error: 'Parâmetro :id inválido' })
    }

    const agent = await Agent.find(id)
    if (!agent) {
      return response.notFound({ error: 'Agent não encontrado' })
    }

    await whatsAppEngine.stopAgent(agent.id)

    return response.ok({
      message: 'WhatsAppEngine parado para o agent',
      agent: {
        id: agent.id,
        name: agent.name,
      },
    })
  }
}
