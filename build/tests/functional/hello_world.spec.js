"use strict";
<<<<<<< HEAD
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Manifest_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Manifest"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
<<<<<<< HEAD
    const data = Chat_1.default.query()
        .preload('shippingcampaign')
        .where('cellphoneserialized', '553198726269@c.us')
        .andWhere('chatnumber', '553171331794');
    const data1 = await data.first();
    console.log(">>>>>>7777777777", data1?.$preloaded.shippingcampaign);
=======
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const response = await client.get('/');
    response.assertStatus(200);
    response.assertBodyContains({ hello: 'world' });
>>>>>>> development
=======
    const query = Manifest_1.default.query()
        .where('chat_id', 7348)
        .first();
    const data = await query;
    if (data?.mainsubject_id)
        await data.load('mainsubject');
    if (data?.chat_id)
        await data.load('chat');
    if (data?.user_responsible_id)
        await data.load('user');
    console.log("DATA::::", data);
>>>>>>> development-ai-cob
});
//# sourceMappingURL=hello_world.spec.js.map