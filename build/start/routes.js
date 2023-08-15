"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const whatsapp_1 = require("../app/Services/whatsapp-web/whatsapp");
console.log("***CHAT BOT V-30***");
console.log(`***NOME DO CLIENTE: ${process.env.CHAT_NAME}***`);
(0, whatsapp_1.executeWhatsapp)();
Route_1.default.get('/', async () => {
    return { hello: 'world - v28' };
});
Route_1.default.group(() => {
    Route_1.default.get('/teste', async () => {
        await (0, whatsapp_1.executeWhatsapp)();
    });
    Route_1.default.post('/restart', 'ShippingcampaignsController.resetWhatsapp');
    Route_1.default.post('/logout', 'ShippingcampaignsController.logout');
    Route_1.default.post('/chat', 'ShippingcampaignsController.chat');
    Route_1.default.get('/maxlimitsendmessage', 'ShippingcampaignsController.maxLimitSendMessage');
    Route_1.default.get('/datasources', 'DatasourcesController.DataSource');
}).prefix('/api');
//# sourceMappingURL=routes.js.map