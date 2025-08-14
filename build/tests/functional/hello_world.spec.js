"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const todayStart = luxon_1.DateTime.now().startOf('day');
    const todayEnd = luxon_1.DateTime.now().endOf('day');
    console.log("teste General", todayStart, todayEnd);
    const query = Shippingcampaign_1.default.query()
        .select('id', 'reg', 'interaction_id', 'phonevalid', 'messagesent')
        .whereBetween('created_at', [todayStart.toSQL({ includeOffset: false }),
        todayEnd.toSQL({ includeOffset: false })]);
    const shippingcampaigns = await query;
    const filteredShendule = shippingcampaigns.filter(item => item.interaction_id === 1);
    const filteredEvalutation = shippingcampaigns.filter(item => item.interaction_id === 2);
    const queryChat = Chat_1.default.query()
        .select('id', 'interaction_id', 'interaction_seq', 'ack', 'returned')
        .whereBetween('created_at', [todayStart.toSQL({ includeOffset: false }),
        todayEnd.toSQL({ includeOffset: false })]);
    const chats = await queryChat;
    const filteredChatSended = chats.filter(item => item.ack >= 2);
    const filteredChatReturned = chats.filter(item => item.ack >= 2 && !!item.returned === true);
    const filteredChatScheduleSended = chats.filter(item => item.interaction_id === 1 && item.interaction_seq === 1 && item.ack >= 2);
    const filteredChatScheduleReturned = chats.filter(item => item.interaction_id === 1 && item.interaction_seq === 1 && item.ack >= 2 && !!item.returned === true);
    const filteredChatEvaluationSended = chats.filter(item => item.interaction_id === 2 && item.ack >= 2);
    const filteredChatEvaluationReturned = chats.filter(item => item.interaction_id === 2 && item.ack >= 2 && !!item.returned === true);
    console.log(`TOTAL DE MENSAGENS PARA ENVIAR NO DIA:${shippingcampaigns.length} - AGENDAMENTO:${filteredShendule.length} - CONFIRMAÇÃO:${filteredEvalutation.length}`);
    console.log(`TOTAL DE MENSAGENS ENVIADAS:${filteredChatSended.length} - AGENDAMENTO:${filteredChatScheduleSended.length} - CONFIRMAÇÃO:${filteredChatEvaluationSended.length}`);
    console.log(`TOTAL DE MENSAGENS RETORNADAS:${filteredChatReturned.length} - AGENDAMENTO:${filteredChatScheduleReturned.length} - CONFIRMAÇÃO:${filteredChatEvaluationReturned.length}`);
});
//# sourceMappingURL=hello_world.spec.js.map