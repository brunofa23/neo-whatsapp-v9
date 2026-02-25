"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class CustomchatValidator {
    constructor(ctx) {
        this.ctx = ctx;
        this.schema = Validator_1.schema.create({
            id: Validator_1.schema.number.optional(),
            chats_id: Validator_1.schema.number.optional(),
            idexternal: Validator_1.schema.number.optional(),
            reg: Validator_1.schema.number.optional(),
            cellphone: Validator_1.schema.string.optional({ trim: true }),
            cellphoneserialized: Validator_1.schema.string.optional({ trim: true }),
            message: Validator_1.schema.string.optional({ trim: true }),
            response: Validator_1.schema.string.optional({ trim: true }),
            returned: Validator_1.schema.boolean.optional(),
            chatname: Validator_1.schema.string.optional({ trim: true }),
            chatnumber: Validator_1.schema.string.optional({ trim: true }),
            messagesent: Validator_1.schema.boolean.optional(),
            read: Validator_1.schema.boolean.optional(),
            viewed: Validator_1.schema.boolean.optional(),
            phonevalid: Validator_1.schema.boolean.optional(),
            ack: Validator_1.schema.number.optional(),
            path_media: Validator_1.schema.string.optional({ trim: true }),
            created_at: Validator_1.schema.date.optional({
                format: 'dd/MM/yyyy HH:mm',
            }),
        });
        this.messages = {
            'chats_id.number': 'O campo "chats_id" deve ser um número.',
            'idexternal.number': 'O campo "idexternal" deve ser um número.',
            'reg.number': 'O campo "reg" deve ser um número.',
            'cellphone.string': 'O campo "celular" deve ser um texto.',
            'cellphoneserialized.string': 'O campo "celular serializado" deve ser um texto.',
            'message.string': 'A mensagem deve ser um texto.',
            'response.string': 'A resposta deve ser um texto.',
            'returned.boolean': 'O campo "returned" deve ser verdadeiro ou falso.',
            'messagesent.boolean': 'O campo "messagesent" deve ser verdadeiro ou falso.',
            'read.boolean': 'O campo "read" deve ser verdadeiro ou falso.',
            'viewed.boolean': 'O campo "viewed" deve ser verdadeiro ou falso.',
            'phonevalid.boolean': 'O campo "phonevalid" deve ser verdadeiro ou falso.',
            'ack.number': 'O campo "ack" deve ser um número.',
            'path_media.string': 'O campo "path_media" deve ser um texto.',
            'created_at.date': 'O campo "created_at" deve ser uma data válida.',
        };
    }
}
exports.default = CustomchatValidator;
//# sourceMappingURL=CustomchatValidator.js.map