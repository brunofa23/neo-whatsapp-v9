import Route from '@ioc:Adonis/Core/Route'
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"

import { connectionAll, destroyFullAgents, resetStatusConnected, sendRepeatedMessage, sendRepeatedMessageKlingo } from './events'

console.log("***CHAT BOT V-125***04/10/2024")
function operacaoAssincrona(callback) {
  if (process.env.SERVER === 'true') {
    console.log("SERVER DATAS")
    sendRepeatedMessage()
    return
  }

  if (process.env.SERVER === 'false') {
    resetStatusConnected()
    destroyFullAgents()
    console.log("Chat Monitoring")
    connectionAll()
    return
  }

  if(process.env.SERVER ==="Klingo"){
    //FAZ INTEGRAÇÃO COM O SISTEMA KLINGO
    console.log("KLINGO....")
    sendRepeatedMessageKlingo()

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
  Route.delete("/agents/:id", "AgentsController.destroy")
  Route.post("/agents/destroyfullagents", "AgentsController.destroyFullAgents")


  //CUSTOM CHATS
  Route.post("/customchat/sendmessage", "CustomchatsController.sendMessage")
  Route.get("/customchat/:id", "CustomchatsController.show")
  Route.post("/customchat/viewedconfirmed/:chats_id", "CustomchatsController.viewedConfirmed")

  //CONFIG
  Route.resource("/config", "ConfigsController").apiOnly()
  //Route.get("/config/:id","ConfigsController.show")
  Route.get("/configs/restartsystem", "ConfigsController.restartSystem")


  Route.get("/smart", "DatasourcesController.scheduledPatients")
  Route.get("/cancelscheduleall", "DatasourcesController.cancelScheduleAll")
  Route.get("/confirmscheduleall", "DatasourcesController.confirmScheduleAll")

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

  Route.get('/doctorlist','ShippingcampaignsController.doctorList')
  Route.get('/unitlist','ShippingcampaignsController.unitList')
  Route.get('/attendantlist','ShippingcampaignsController.attendantList')

  //shippingcampaigns
  Route.patch('/shippingcampaigns/:id','ShippingcampaignsController.update')
  Route.get('/shippingcampaigns/:id','ShippingcampaignsController.show')
  Route.get('/shippingcampaigns','ShippingcampaignsController.index')
  Route.post('/shippingcampaigns','ShippingcampaignsController.store')
  Route.post('/resend/:id','ShippingcampaignsController.resend')

  //chats
  Route.resource('/chats', 'ChatsController').apiOnly()
  Route.post('/closed', 'ChatsController.closed')

  //MIDIAS
  Route.get('/midia/:filename','MidiasController.midia')
  Route.get('/midiapath/:filename','MidiasController.midiapath')

  //DATECLOSED
  Route.resource('/datecloseds','DateclosedsController').apiOnly()


  //ROUTES FOR KLINGO / APIS
  Route.get('/getschedules','DatasourceApisController.getSchedules')
  Route.post('/confirmorcancelschedule','DatasourceApisController.confirmOrCancelSchedule')


}).prefix('/api')




