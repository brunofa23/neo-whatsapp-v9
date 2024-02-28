import Route from '@ioc:Adonis/Core/Route'
import Chat from 'App/Models/Chat';
import Shippingcampaign from 'App/Models/Shippingcampaign';
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"

//import { connectionAll, resetStatusConnected, sendRepeatedMessage } from "../app/Services/whatsapp-web/util"
import { connectionAll, sendRepeatedMessage, resetStatusConnected } from './events'

console.log("***CHAT BOT V-103***28/02/2024")
resetStatusConnected()

function operacaoAssincrona(callback) {
  if (process.env.SERVER === 'true') {
    console.log("SERVER DATAS")
    sendRepeatedMessage()
    return
  }

  if (process.env.SERVER === 'false') {
    console.log("Chat Monitoring")
    connectionAll()
    return
  }
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
    // global.agentDefault = { name: 'Bruno', sobrenome: "Favato" }
    // return global.agentDefault
    const chat = await Chat.query()
      .preload('shippingcampaign')
      .where('cellphoneserialized', '=', '553185228619@c.us')
      .whereNull('response')
    return chat

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
  Route.post("/agents/connectionagentchat/:id", "AgentsController.connectionAgentChat")
  Route.post("/agents/sendmessageagentdefalut", "AgentsController.sendMessageAgentDefalut")
  Route.post("/agents/destroy/:id", "AgentsController.destroy")

  //CUSTOM CHATS
  Route.post("/customchat/sendmessage", "CustomchatsController.sendMessage")
  Route.get("/customchat/:id", "CustomchatsController.show")
  Route.post("/customchat/viewedconfirm/:chats_id", "CustomchatsController.viewedConfirm")

  //CONFIG
  Route.resource("/config", "ConfigsController").apiOnly()


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




