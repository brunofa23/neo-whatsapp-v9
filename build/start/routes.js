"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const PersistShippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/PersistShippingcampaign"));
const events_1 = require("./events");
console.log("***CHAT BOT V-126***16/05/2025", process.env.SERVER);
function operacaoAssincrona(callback) {
    console.log("ENTREI PASSO 1", process.env.SERVER);
    if (process.env.SERVER === 'true') {
        console.log("INICIALIZANDO EASYTALK SERVIDOR");
        (0, events_1.sendRepeatedMessage)();
        return;
    }
    if (process.env.SERVER?.toLowerCase() === 'false') {
        console.log("INICIALIZANDO EASYTALK SMART");
        (0, events_1.destroyFullAgents)();
        (0, events_1.resetStatusConnected)();
        (0, events_1.connectionAll)();
        return;
    }
    if (process.env.SERVER?.toLowerCase() === "klingo") {
        console.log("INICIALIZANDO EASYTALK KLINGO....");
        (0, events_1.destroyFullAgents)();
        (0, events_1.sendRepeatedMessageKlingo)();
        (0, events_1.resetStatusConnected)();
        (0, events_1.connectionAll)();
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
    Route_1.default.post("/agents/connectionagentchat/:id", "AgentsController.connectionAgentChat");
    Route_1.default.post("/agents/sendmessageagentdefalut", "AgentsController.sendMessageAgentDefalut");
    Route_1.default.delete("/agents/:id", "AgentsController.destroy");
    Route_1.default.post("/agents/destroyfullagents", "AgentsController.destroyFullAgents");
    Route_1.default.get("/verifystatusagent", "AgentsController.verifyStatusAgent");
    Route_1.default.post("/customchat/sendmessage", "CustomchatsController.sendMessage");
    Route_1.default.get("/customchat/:id", "CustomchatsController.show");
    Route_1.default.post("/customchat/viewedconfirmed/:chats_id", "CustomchatsController.viewedConfirmed");
    Route_1.default.resource("/config", "ConfigsController").apiOnly();
    Route_1.default.get("/configs/restartsystem", "ConfigsController.restartSystem");
    Route_1.default.get("/smart", "DatasourcesController.scheduledPatients");
    Route_1.default.get("/cancelscheduleall", "DatasourcesController.cancelScheduleAll");
    Route_1.default.get("/confirmscheduleall", "DatasourcesController.confirmScheduleAll");
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
    Route_1.default.get('/doctorlist', 'ShippingcampaignsController.doctorList');
    Route_1.default.get('/unitlist', 'ShippingcampaignsController.unitList');
    Route_1.default.get('/attendantlist', 'ShippingcampaignsController.attendantList');
    Route_1.default.patch('/shippingcampaigns/:id', 'ShippingcampaignsController.update');
    Route_1.default.get('/shippingcampaigns/:id', 'ShippingcampaignsController.show');
    Route_1.default.get('/shippingcampaigns', 'ShippingcampaignsController.index');
    Route_1.default.post('/shippingcampaigns', 'ShippingcampaignsController.store');
    Route_1.default.post('/resend/:id', 'ShippingcampaignsController.resend');
    Route_1.default.resource('/chats', 'ChatsController').apiOnly();
    Route_1.default.post('/closed', 'ChatsController.closed');
    Route_1.default.resource("/manifests", "ManifestsController").apiOnly();
    Route_1.default.post("/sendmailmanifest/:id", "ManifestsController.sendMailManifest");
    Route_1.default.get('/midia/:filename', 'MidiasController.midia');
    Route_1.default.get('/midiapath/:filename', 'MidiasController.midiapath');
    Route_1.default.resource('/datecloseds', 'DateclosedsController').apiOnly();
    Route_1.default.get('/getschedules', 'DatasourceApisController.getSchedules');
    Route_1.default.post('/confirmorcancelscheduleapi', 'DatasourceApisController.confirmOrCancelSchedule');
    Route_1.default.resource('/mainsubjects', 'MainsubjectsController').apiOnly();
}).prefix('/api');
//# sourceMappingURL=routes.js.map