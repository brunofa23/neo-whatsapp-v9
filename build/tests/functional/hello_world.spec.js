"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    console.log("passei no RESEND............................");
    const now = luxon_1.DateTime.now();
    const yesterdayStart = now.minus({ days: 1 }).startOf('day');
    const yesterdayEnd = now.minus({ days: 1 }).endOf('day');
    const tomorrowStart = now.plus({ days: 1 }).startOf('day');
    const tomorrowEnd = now.plus({ days: 1 }).endOf('day');
    const yesterdayNoon = now.minus({ days: 1 }).set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
    const query = Shippingcampaign_1.default.query()
        .where('created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('created_at', '<=', yesterdayEnd.toSQL({ includeOffset: false }))
        .where('dateshedule', '>=', tomorrowStart.toSQL({ includeOffset: false }))
        .where('dateshedule', '<=', tomorrowEnd.toSQL({ includeOffset: false }))
        .andWhere('interaction_id', 1)
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhereNull('excluded');
    const updatedResend = await query;
    console.log(query.toQuery());
    const subquery = Database_1.default.from('chats')
        .innerJoin('shippingcampaigns', 'shippingcampaigns.id', 'chats.shippingcampaigns_id')
        .where('shippingcampaigns.created_at', '>=', yesterdayStart.toSQL({ includeOffset: false }))
        .where('shippingcampaigns.created_at', '<=', yesterdayNoon.toSQL({ includeOffset: false }))
        .where('shippingcampaigns.interaction_id', 1)
        .where('shippingcampaigns.interaction_seq', 1)
        .where('chats.returned', 0)
        .where('chats.ack', 2)
        .select('chats.id');
    await Chat_1.default.query()
        .whereIn('id', Database_1.default.from(subquery.as('temp')));
});
//# sourceMappingURL=hello_world.spec.js.map