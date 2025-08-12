"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const luxon_1 = require("luxon");
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const yesterday = luxon_1.DateTime.local().toFormat('yyyy-MM-dd 00:00');
    const query = Shippingcampaign_1.default.query()
        .whereNull('phonevalid')
        .andWhere('messagesent', 0)
        .andWhere('created_at', '>', yesterday);
    query.whereNotExists((subquery) => {
        subquery.select('*').from('chats')
            .whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id')
            .andWhereNull('chats.excluded');
    });
    query.orderByRaw('RAND()').limit(10);
    console.log(">>>>", query.toQuery());
});
//# sourceMappingURL=hello_world.spec.js.map