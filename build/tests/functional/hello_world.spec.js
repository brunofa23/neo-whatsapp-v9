"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const returnAck = Chat_1.default.query()
        .where('message', 'Saudações! Aqui é a Iris atendente virtual do Cob, o motivo do meu contato Sra. ROSINHA é para confirmar o horário conosco, agendado para o dia *03/02/2025 13:00* na unidade BH (BAIRRO SANTA EFIGÊNIA) - CENTRO DE OFTALMOLOGIA BRASIL com Dr(a). COB podemos confirmar? *1* para Sim *2* para Desmarcar.Caso não haja interação em até 12 horas, o agendamento será automaticamente cancelado.')
        .andWhere('cellphoneserialized', '553185228619@c.us')
        .andWhere('chatnumber', 'LIKE', String('553196218275@c.us').replace(/\D/g, ''));
    console.log(returnAck.toQuery());
    const teste = await returnAck;
});
//# sourceMappingURL=hello_world.spec.js.map