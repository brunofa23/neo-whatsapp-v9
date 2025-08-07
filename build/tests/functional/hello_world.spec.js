"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const Agent_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Agent"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const agentCompany = await Agent_1.default.query().where('id', 449).first();
    const yesterday = luxon_1.DateTime.local().toFormat('yyyy-MM-dd 00:00');
    const query = Shippingcampaign_1.default.query()
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhere('created_at', '>', yesterday);
    if (agentCompany?.company_id) {
        query.andWhere('company_id', agentCompany?.company_id);
    }
    else
        query.whereNull('company_id');
    query.whereNotExists((subquery) => {
        subquery.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
    });
    if (agentCompany?.interaction_priority?.toLocaleUpperCase() === 'CONFIRMATION')
        query.orderByRaw('(interaction_id!=1),RAND()').limit(10);
    else if (agentCompany?.interaction_priority?.toLocaleUpperCase() === 'EVALUATION')
        query.orderByRaw('(interaction_id!=2),RAND()').limit(10);
    else
        query.orderByRaw('RAND()').limit(10);
    console.log(">>>QUERY:", query.toQuery());
});
//# sourceMappingURL=hello_world.spec.js.map