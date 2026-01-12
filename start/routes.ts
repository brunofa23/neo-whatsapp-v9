import Route from '@ioc:Adonis/Core/Route'
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"

import { connectionAll, destroyFullAgents, resendMessage, resetStatusConnected, sendRepeatedMessage, sendRepeatedMessageKlingo } from './events'
import { DateTime } from 'luxon'

console.log("***CHAT BOT V-126***16/05/2025", process.env.SERVER)
function operacaoAssincrona(callback) {
  console.log("ENTREI PASSO 1", process.env.SERVER)
  if (process.env.SERVER === 'true') {
    console.log("INICIALIZANDO EASYTALK SERVIDOR")
    sendRepeatedMessage()
    return
  }

  if (process.env.SERVER?.toLowerCase() === 'false') {
    console.log("INICIALIZANDO EASYTALK SMART")
    destroyFullAgents()
    resetStatusConnected()
    connectionAll()
    resendMessage()
    return
  }

  if (process.env.SERVER?.toLowerCase() === "klingo") {
    //FAZ INTEGRAÇÃO COM O SISTEMA KLINGO
    console.log("INICIALIZANDO EASYTALK KLINGO....")
    destroyFullAgents()
    sendRepeatedMessageKlingo()
    // resetStatusConnected()
    // connectionAll()
    // resendMessage()
    return
  }

  if (process.env.SERVER?.toLowerCase() === "klingoServer") {
    //FAZ INTEGRAÇÃO COM O SISTEMA KLINGO
    console.log("INICIALIZANDO EASYTALK KLINGO SERVER....")
    sendRepeatedMessageKlingo()
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

  //Executa busca no Smart
  Route.get('/executequery', async ({ request }) => {
    const { unit, date, interaction_id } = request.only(['unit', 'date', 'interaction_id'])
    const dateQuery = DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: 'America/Sao_Paulo' });
    console.log("EXECUTANDO BUSCA NO SMART")

    if (dateQuery.isValid) {
      console.log('Data válida:', dateQuery.toISODate());
      await PersistShippingcampaign(dateQuery.toFormat('yyyy-MM-dd'), false, interaction_id, unit)
      return
    } else {
      console.log('Data inválida!');
    }

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

  Route.get("/verifystatusagent", "AgentsController.verifyStatusAgent")

  //CUSTOM CHATS
  Route.post("/customchat/sendmessage", "CustomchatsController.sendMessage")
  Route.get("/customchat/:id", "CustomchatsController.show")
  Route.post("/customchat/viewedconfirmed/:chats_id", "CustomchatsController.viewedConfirmed")

  //CONFIG
  Route.resource("/config", "ConfigsController").apiOnly()
  //Route.get("/config/:id","ConfigsController.show")
  Route.get("/configs/restartsystem", "ConfigsController.restartSystem")


  Route.get("/scheduledPatients", "DatasourcesController.scheduledPatients")
  Route.get("/cancelscheduleall", "DatasourcesController.cancelScheduleAll")
  Route.get("/confirmscheduleall", "DatasourcesController.confirmScheduleAll")
  Route.get('/patientsbyprocedures', "DatasourcesController.patientsByProcedures")
  Route.get('/patientsbyschedules', "DatasourcesController.patientsBySchedules")


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

  Route.get('/doctorlist', 'ShippingcampaignsController.doctorList')
  Route.get('/unitlist', 'ShippingcampaignsController.unitList')
  Route.get('/attendantlist', 'ShippingcampaignsController.attendantList')

  //shippingcampaigns
  Route.patch('/shippingcampaigns/:id', 'ShippingcampaignsController.update')
  Route.get('/shippingcampaigns/:id', 'ShippingcampaignsController.show')
  Route.get('/shippingcampaigns', 'ShippingcampaignsController.index')
  Route.post('/shippingcampaigns', 'ShippingcampaignsController.store')
  Route.post('/resend/:id', 'ShippingcampaignsController.resend')
  Route.get('/searchschedulepatients', 'ShippingcampaignsController.searchSchedulePatients')
  Route.get('/executeschedulepatients', 'ShippingcampaignsController.executeSchedulePatients')
  Route.get('/dashboardgeneral', 'ShippingcampaignsController.dashboardGeneral')

  //chats
  Route.resource('/chats', 'ChatsController').apiOnly()
  Route.post('/closed', 'ChatsController.closed')

  //MANIFESTS
  Route.resource("/manifests", "ManifestsController").apiOnly()
  Route.post("/sendmailmanifest/:id", "ManifestsController.sendMailManifest")

  //MIDIAS
  Route.get('/midia/:filename', 'MidiasController.midia')
  Route.get('/midiapath/:filename', 'MidiasController.midiapath')

  //DATECLOSED
  Route.resource('/datecloseds', 'DateclosedsController').apiOnly()

  //ROUTES FOR KLINGO / APIS
  Route.get('/getschedules', 'DatasourceApisController.getSchedules')
  Route.post('/confirmorcancelscheduleapi', 'DatasourceApisController.confirmOrCancelSchedule')

  //MAINSUBJECT
  Route.resource('/mainsubjects', 'MainsubjectsController').apiOnly()

  // start/routes.ts
  Route.post('/webhooks/gupshup', 'GupshupWebhooksController.handle')


}).prefix('/api')




