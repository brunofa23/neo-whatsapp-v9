"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Template_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Template"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
class TemplatesController {
    async index({ auth, request }) {
        await auth.use('api').authenticate();
        const inactive = request.input('inactive');
        const query = Template_1.default.query().orderBy('id', 'desc');
        if (inactive !== undefined && inactive !== null) {
            const inactiveBool = String(inactive).toLowerCase() === 'true';
            query.where('inactive', inactiveBool);
        }
        const templates = await query;
        return templates;
    }
    async show({ auth, params, response }) {
        await auth.use('api').authenticate();
        const template = await Template_1.default.find(params.id);
        if (!template) {
            return response.notFound({ error: 'Template não encontrado' });
        }
        return template;
    }
    async store({ auth, request, response }) {
        await auth.use('api').authenticate();
        const templateSchema = Validator_1.schema.create({
            id_external: Validator_1.schema.string({}, [
                Validator_1.rules.maxLength(255),
            ]),
            type: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(50),
            ]),
            title: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            description: Validator_1.schema.string.optional({ trim: true }),
            inactive: Validator_1.schema.boolean.optional(),
        });
        const payload = await request.validate({
            schema: templateSchema,
            messages: {
                'id_external.required': 'O campo id_external é obrigatório',
            },
        });
        const template = await Template_1.default.create(payload);
        return response.status(201).send(template);
    }
    async update({ auth, params, request, response }) {
        await auth.use('api').authenticate();
        const template = await Template_1.default.find(params.id);
        if (!template) {
            return response.notFound({ error: 'Template não encontrado' });
        }
        const updateSchema = Validator_1.schema.create({
            id_external: Validator_1.schema.string.optional({}, [
                Validator_1.rules.maxLength(255),
            ]),
            type: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(50),
            ]),
            title: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(255),
            ]),
            description: Validator_1.schema.string.optional({ trim: true }),
            inactive: Validator_1.schema.boolean.optional(),
        });
        const payload = await request.validate({
            schema: updateSchema,
        });
        template.merge(payload);
        await template.save();
        return template;
    }
    async destroy({ auth, params, response }) {
        await auth.use('api').authenticate();
        const template = await Template_1.default.find(params.id);
        if (!template) {
            return response.notFound({ error: 'Template não encontrado' });
        }
        await template.delete();
        return response.status(204);
    }
}
exports.default = TemplatesController;
//# sourceMappingURL=TemplatesController.js.map