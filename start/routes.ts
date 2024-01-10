import Route from '@ioc:Adonis/Core/Route'

//import { validAgent } from "../app/Services/whatsapp-web/util"
import { connectionAll, sendRepeatedMessage, resetStatusConnected } from './events'

import { DateTime } from 'luxon';
import Agent from 'App/Models/Agent';

console.log("***CHAT BOT V-89***10/01/2024")
console.log(`***NOME DO CLIENTE: ${process.env.CHAT_NAME}***`)

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

    // const agentMaxLimitSend = await Agent.query().where('id', 1).first()
    // if (agentMaxLimitSend == null)
    //   return 0

    // return agentMaxLimitSend?.max_limit_message
    // const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')

    // return await Shippingcampaign.query().whereNull('phonevalid')
    //   .andWhere('created_at', '>', yesterday).orderBy(['interaction_id', 'created_at']).first()
  }

  )

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

  Route.get('/confirmschedule', 'DatasourcesController.confirmSchedule')
  Route.get('/serviceevaluation', 'DatasourcesController.serviceEvaluation')

}).prefix('/api')




