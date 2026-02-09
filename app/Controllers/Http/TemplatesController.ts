// app/Controllers/Http/TemplatesController.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Template from 'App/Models/Template'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class TemplatesController {
  /**
   * GET /templates
   * Lista templates (pode filtrar por inativos via query ?inactive=true/false)
   */
  public async index({ auth, request }: HttpContextContract) {
    await auth.use('api').authenticate()

    const inactive = request.input('inactive')

    const query = Template.query().orderBy('id', 'desc')

    if (inactive !== undefined && inactive !== null) {
      // converte string "true"/"false" em boolean
      const inactiveBool = String(inactive).toLowerCase() === 'true'
      query.where('inactive', inactiveBool)
    }

    const templates = await query

    return templates
  }

  /**
   * GET /templates/:id
   * Mostra um template pelo ID
   */
  public async show({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const template = await Template.find(params.id)

    if (!template) {
      return response.notFound({ error: 'Template não encontrado' })
    }

    return template
  }

  /**
   * POST /templates
   * Cria um novo template
   */
  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const templateSchema = schema.create({
      id_external: schema.string({}, [
        rules.maxLength(255),
      ]),
      type: schema.string.optional({ trim: true }, [
        rules.maxLength(50),
      ]),
      title: schema.string.optional({ trim: true }, [
        rules.maxLength(255),
      ]),
      description: schema.string.optional({ trim: true }),
      inactive: schema.boolean.optional(),
    })

    const payload = await request.validate({
      schema: templateSchema,
      messages: {
        'id_external.required': 'O campo id_external é obrigatório',
      },
    })

    const template = await Template.create(payload)

    return response.status(201).send(template)
  }

  /**
   * PUT /templates/:id
   * Atualiza um template existente
   */
  public async update({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const template = await Template.find(params.id)

    if (!template) {
      return response.notFound({ error: 'Template não encontrado' })
    }

    const updateSchema = schema.create({
      id_external: schema.string.optional({}, [
        rules.maxLength(255),
      ]),
      type: schema.string.optional({ trim: true }, [
        rules.maxLength(50),
      ]),
      title: schema.string.optional({ trim: true }, [
        rules.maxLength(255),
      ]),
      description: schema.string.optional({ trim: true }),
      inactive: schema.boolean.optional(),
    })

    const payload = await request.validate({
      schema: updateSchema,
    })

    template.merge(payload)
    await template.save()

    return template
  }

  /**
   * DELETE /templates/:id
   * Remove um template (delete físico).
   * Se preferir "soft delete", pode trocar para apenas marcar inactive = true.
   */
  public async destroy({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const template = await Template.find(params.id)

    if (!template) {
      return response.notFound({ error: 'Template não encontrado' })
    }

    await template.delete()

    return response.status(204)
  }
}
