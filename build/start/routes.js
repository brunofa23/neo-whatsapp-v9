"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const util_1 = require("../app/Services/whatsapp-web/util");
const events_1 = require("./events");
console.log("***CHAT BOT V-88***21/12/2023");
console.log(`***NOME DO CLIENTE: ${process.env.CHAT_NAME}***`);
function operacaoAssincrona(callback) {
    if (process.env.SERVER === 'true') {
        console.log("SERVER DATAS");
        return;
    }
    setTimeout(function () {
        callback(null, (0, events_1.connectionAll)());
    }, 1000);
}
operacaoAssincrona(function (erro, resultado) {
    if (erro) {
        console.error('Erro:', erro);
    }
    else {
        console.log('Resultado:', resultado);
    }
});
setInterval(() => {
    if (process.env.SERVER === 'true') {
        console.log("SERVER DATAS");
        return;
    }
    (0, util_1.validAgent)();
}, 100000);
Route_1.default.get('/', async () => {
    return { hello: 'world' };
});
Route_1.default.group(() => {
    Route_1.default.get('/start', async () => {
        await (0, util_1.validAgent)();
        return "Executei a chamada da api do whatsapp";
    });
    Route_1.default.get("/validagent", "AgentsController.validAgent");
    Route_1.default.get("/agents", "AgentsController.index");
    Route_1.default.post("/agents", "AgentsController.store");
    Route_1.default.post("/agents/connection/:id", "AgentsController.connection");
    Route_1.default.post("/agents/connectionall", "AgentsController.connectionAll");
    Route_1.default.put("/agents/:id", "AgentsController.update");
    Route_1.default.get("/smart", "DatasourcesController.scheduledPatients");
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
    Route_1.default.get('/confirmschedule', 'DatasourcesController.confirmSchedule');
    Route_1.default.get('/serviceevaluation', 'DatasourcesController.serviceEvaluation');
}).prefix('/api');
//# sourceMappingURL=routes.js.map