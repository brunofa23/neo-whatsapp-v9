// app/Validators/CustomchatValidator.ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

export default class CustomchatValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    // normalmente o id é auto-increment, então deixei opcional
    id: schema.number.optional(),

    chats_id: schema.number.optional(),
    idexternal: schema.number.optional(),
    reg: schema.number.optional(),
    template_id: schema.number.optional(),

    cellphone: schema.string.optional({ trim: true }),
    cellphoneserialized: schema.string.optional({ trim: true }),

    message: schema.string.optional({ trim: true }),
    response: schema.string.optional({ trim: true }),
    reason: schema.string.optional({ trim: true }, [
      rules.maxLength(60),
    ]),

    returned: schema.boolean.optional(),

    chatname: schema.string.optional({ trim: true }),
    chatnumber: schema.string.optional({ trim: true }),

    messagesent: schema.boolean.optional(),
    read: schema.boolean.optional(),
    viewed: schema.boolean.optional(),
    phonevalid: schema.boolean.optional(),

    ack: schema.number.optional(),

    path_media: schema.string.optional({ trim: true }),

    // se você realmente receber created_at no body
    //created_at: schema.date.optional(), // formato padrão aceito (ISO)
    created_at: schema.date.optional({
      format: 'dd/MM/yyyy HH:mm', // <- mesmo formato que vem do frontend
    }),
  })

  public messages = {
    // Nomes dos campos em português mais amigáveis
    'chats_id.number': 'O campo "chats_id" deve ser um número.',
    'idexternal.number': 'O campo "idexternal" deve ser um número.',
    'reg.number': 'O campo "reg" deve ser um número.',
    'template_id.number': 'O campo "template_id" deve ser um número.',

    'cellphone.string': 'O campo "celular" deve ser um texto.',
    'cellphoneserialized.string': 'O campo "celular serializado" deve ser um texto.',

    'message.string': 'A mensagem deve ser um texto.',
    'response.string': 'A resposta deve ser um texto.',
    'reason.string': 'O campo "reason" deve ser um texto.',
    'reason.maxLength': 'O campo "reason" deve ter no máximo 60 caracteres.',

    'returned.boolean': 'O campo "returned" deve ser verdadeiro ou falso.',
    'messagesent.boolean': 'O campo "messagesent" deve ser verdadeiro ou falso.',
    'read.boolean': 'O campo "read" deve ser verdadeiro ou falso.',
    'viewed.boolean': 'O campo "viewed" deve ser verdadeiro ou falso.',
    'phonevalid.boolean': 'O campo "phonevalid" deve ser verdadeiro ou falso.',

    'ack.number': 'O campo "ack" deve ser um número.',
    'path_media.string': 'O campo "path_media" deve ser um texto.',
    'created_at.date': 'O campo "created_at" deve ser uma data válida.',
  }
}
