"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const data = Chat_1.default.query()
        .preload('shippingcampaign')
        .where('cellphoneserialized', '553198726269@c.us')
        .andWhere('chatnumber', '553171331794');
    const data1 = await data.first();
    console.log(">>>>>>7777777777", data1?.$preloaded.shippingcampaign);
});
//# sourceMappingURL=hello_world.spec.js.map