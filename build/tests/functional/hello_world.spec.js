"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const chatOtherFields = {
        address_unit: 'Av. Augusto de Lima, 1126 - Barro Preto - BH',
        medic: 'ANA FLAVIA DIAS MEDEIROS',
        schedule: '2025-01-29 08:20',
        phone_unit: '(31) 3227-1000',
        name_unit: 'BH (BAIRRO BARRO PRETO) - CENTRO DE OFTALMOLOGIA BRASIL'
    };
    console.log(chatOtherFields);
    const response1schedule = await Response_1.default.query()
        .select('message')
        .where('local', 'response1schedule')
        .andWhere('inactive', false)
        .first();
    const formatMessage = (template, fields) => {
        return template
            .replace('{name_unit}', fields.name_unit)
            .replace('{address_unit}', fields.address || 'Endereço indisponível')
            .replace('{medic}', fields.medic || 'Médico não informado')
            .replace('{phone_unit}', fields.phone_unit || 'Contato indisponível')
            .replace('{schedule}', fields.schedule);
    };
    const teste = formatMessage(response1schedule.message, chatOtherFields);
    console.log("teste:::", teste);
});
//# sourceMappingURL=hello_world.spec.js.map