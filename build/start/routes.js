"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const PersistShippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/PersistShippingcampaign"));
const events_1 = require("./events");
console.log("***CHAT BOT V-96***17/01/2024");
(0, events_1.resetStatusConnected)();
function operacaoAssincrona(callback) {
    if (process.env.SERVER === 'true') {
        console.log("SERVER DATAS");
        (0, events_1.sendRepeatedMessage)();
        return;
    }
}
operacaoAssincrona(function (erro, resultado) {
    if (erro) {
        console.error('Erro:', erro);
    }
    else {
        console.log('Resultado:', resultado);
    }
});
Route_1.default.get('/', async () => {
    return { hello: 'world' };
});
Route_1.default.group(() => {
    Route_1.default.get('/start', async () => {
        return await Shippingcampaign_1.default.query()
            .whereNull('phonevalid')
            .andWhere('messagesent', 0)
            .andWhere('created_at', '>', '2024-01-16')
            .whereNotExists((query) => {
            query.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
        }).first();
    });
    Route_1.default.get('/executequery', async () => {
        console.log("EXECUTANDO BUSCA NO SMART");
        await (0, PersistShippingcampaign_1.default)();
    });
    Route_1.default.resource("/users", "UsersController").apiOnly();
    Route_1.default.post("/login", "UsersController.login");
    Route_1.default.get("/validagent", "AgentsController.validAgent");
    Route_1.default.get("/agents", "AgentsController.index");
    Route_1.default.post("/agents", "AgentsController.store");
    Route_1.default.post("/agents/connection/:id", "AgentsController.connection");
    Route_1.default.post("/agents/connectionall", "AgentsController.connectionAll");
    Route_1.default.put("/agents/:id", "AgentsController.update");
    Route_1.default.get("/smart", "DatasourcesController.scheduledPatients");
    Route_1.default.get("/confirmscheduleall", "DatasourcesController.cancelScheduleAll");
    Route_1.default.post('/restart', 'ShippingcampaignsController.resetWhatsapp');
    Route_1.default.post('/logout', 'ShippingcampaignsController.logout');
    Route_1.default.post('/chat', 'ShippingcampaignsController.chat');
    Route_1.default.get('/maxlimitsendmessage', 'ShippingcampaignsController.maxLimitSendMessage');
    Route_1.default.get('/datasources', 'DatasourcesController.DataSource');
    Route_1.default.get('/dayposition', 'ShippingcampaignsController.dayPosition');
    Route_1.default.get('/dateposition', 'ShippingcampaignsController.datePosition');
    Route_1.default.get('/datepositionsynthetic', 'ShippingcampaignsController.datePositionSynthetic');
    Route_1.default.get('/listshippingcampaigns', 'ShippingcampaignsController.listShippingCampaigns');
    Route_1.default.get('/serviceevaluationdashboard', 'ShippingcampaignsController.serviceEvaluationDashboard');
    Route_1.default.get('/scheduleconfirmationdashboard', 'ShippingcampaignsController.scheduleConfirmationDashboard');
    Route_1.default.get('/confirmschedule', 'DatasourcesController.confirmSchedule');
    Route_1.default.get('/serviceevaluation', 'DatasourcesController.serviceEvaluation');
}).prefix('/api');
//# sourceMappingURL=routes.js.map