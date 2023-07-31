"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const whatsapp_1 = require("../app/Services/whatsapp-web/whatsapp");
Route_1.default.get('/', async () => {
    return { hello: 'world - v39' };
});
Route_1.default.group(() => {
    Route_1.default.get('/teste', async () => {
        await (0, whatsapp_1.executeWhatsapp)();
    });
    Route_1.default.post('/restart', 'ShippingcampaignsController.resetWhatsapp');
    Route_1.default.post('/logout', 'ShippingcampaignsController.logout');
    Route_1.default.post('/chat', 'ShippingcampaignsController.chat');
}).prefix('/api');
Route_1.default.get('/mysql', async () => {
    return Database_1.default.connection('mysql').from('emp').select('*');
});
//# sourceMappingURL=routes.js.map