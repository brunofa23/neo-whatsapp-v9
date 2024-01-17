import Route from '@ioc:Adonis/Core/Route'
import Shippingcampaign from 'App/Models/Shippingcampaign';
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import { DateTime } from 'luxon';

//import { connectionAll, resetStatusConnected, sendRepeatedMessage } from "../app/Services/whatsapp-web/util"
import { connectionAll, sendRepeatedMessage, resetStatusConnected } from './events'

console.log("***CHAT BOT V-97***17/01/2024")

resetStatusConnected()
function operacaoAssincrona(callback) {
  if (process.env.SERVER === 'true') {
    console.log("SERVER DATAS")
    sendRepeatedMessage()
    return
  }
  // setTimeout(function () {
  //   callback(null, connectionAll());
  // }, 1000); // Aguarde 1 segundo antes de chamar o callback
}

operacaoAssincrona(function (erro, resultado) {
  if (erro) {
    console.error('Erro:', erro);
  } else {
    console.log('Resultado:', resultado);
  }
});


Route.get('/', async () => {
  return { hello: 'world' }
})

Route.group(() => {


  Route.get('/start', async () => {
    // return await Shippingcampaign.query()
    //   .whereNull('phonevalid')
    //   .andWhere('messagesent', 0)
    //   .andWhere('created_at', '>', '2024-01-16').toQuery()

    return await Shippingcampaign.query()
      .whereNull('phonevalid')
      .andWhere('messagesent', 0)
      .andWhere('created_at', '>', '2024-01-16') // Certifique-se de usar a data correta aqui
      .whereNotExists((query) => {
        query.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
      }).first()



  })

  //Executa busca no Smart
  Route.get('/executequery', async () => {
    console.log("EXECUTANDO BUSCA NO SMART")
    await PersistShippingcampaign()

  })

  //USERS
  Route.resource("/users", "UsersController").apiOnly()

  //LOGIN
  Route.post("/login", "UsersController.login")


  //AGENTS
  Route.get("/validagent", "AgentsController.validAgent")
  Route.get("/agents", "AgentsController.index")
  Route.post("/agents", "AgentsController.store")
  Route.post("/agents/connection/:id", "AgentsController.connection")
  Route.post("/agents/connectionall", "AgentsController.connectionAll")
  Route.put("/agents/:id", "AgentsController.update")


  Route.get("/smart", "DatasourcesController.scheduledPatients")
  Route.get("/confirmscheduleall", "DatasourcesController.cancelScheduleAll")


  Route.post('/restart', 'ShippingcampaignsController.resetWhatsapp')
  Route.post('/logout', 'ShippingcampaignsController.logout')

  Route.post('/chat', 'ShippingcampaignsController.chat')
  Route.get('/maxlimitsendmessage', 'ShippingcampaignsController.maxLimitSendMessage')
  Route.get('/datasources', 'DatasourcesController.DataSource')
  Route.get('/dayposition', 'ShippingcampaignsController.dayPosition')
  Route.get('/dateposition', 'ShippingcampaignsController.datePosition')
  Route.get('/datepositionsynthetic', 'ShippingcampaignsController.datePositionSynthetic')
  Route.get('/listshippingcampaigns', 'ShippingcampaignsController.listShippingCampaigns')
  Route.get('/serviceevaluationdashboard', 'ShippingcampaignsController.serviceEvaluationDashboard')
  Route.get('/scheduleconfirmationdashboard', 'ShippingcampaignsController.scheduleConfirmationDashboard')

  Route.get('/confirmschedule', 'DatasourcesController.confirmSchedule')
  Route.get('/serviceevaluation', 'DatasourcesController.serviceEvaluation')

}).prefix('/api')




