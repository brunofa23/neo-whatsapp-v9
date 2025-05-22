import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Agent from 'App/Models/Agent';
import Chat from "App/Models/Chat"
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { DateTime } from 'luxon';
import { Client } from "whatsapp-web.js"
import { DateFormat, ExecutingSendMessage, extractCellphone, GenerateRandomTime, TimeSchedule } from './util'
import Log from "App/Models/Log"
import Talk from 'App/Models/Talk';

global.contSend = 0
//const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')
let resetContSend = DateTime.local()
let resetContSendBool = false
const shippingcampaignsController = new ShippingcampaignsController()

export default async (client: Client, agent: Agent) => {

  async function verifyClientSend(client, cellphone) {
    console.log("*** PASSO 5.1.1")
    if (client?.info?.wid) {
      const query = Chat.query()
        .where('cellphone', cellphone)
        .andWhere('created_at', '>', dayBefore5)
        .andWhere('chatnumber', client.info.wid.user)

      console.log("*** PASSO 5.1.2:", query.toQuery())
      return await query.first()
    }
    else {
      console.log("cliente não conectado")
      return
    }
  }

  async function verifyContSend() {
    if (global.contSend >= 3) {
      if (resetContSendBool == false) {
        resetContSend = DateTime.local().plus({ minutes: 4 })
        resetContSendBool = true
      }
      else if (resetContSend <= DateTime.local()) {
        resetContSendBool = false
        global.contSend = 0
      }
    }
  }

  async function countLimitSendMessage() {
    const value = await shippingcampaignsController.maxLimitSendMessage(agent)
    return value
  }

  async function maxLimitSendMessageAgent(id) {
    const agentMaxLimitSend = await Agent.query().where('id', id).first()
    if (agentMaxLimitSend == undefined || agentMaxLimitSend?.max_limit_message == undefined)
      return 0
    return agentMaxLimitSend?.max_limit_message
  }

  //********************************************************************* */
  async function sendMessages() {
    const totMessageSend = await countLimitSendMessage()
    const maxLimitSendAgent = await maxLimitSendMessageAgent(agent.id)
    const shippingCampaign = await shippingcampaignsController.patientToSend(agent)
    let verifyChat
    let verifycontsend

    console.log("**PASSO 1 - GLOBAL_CONT(Total de clientes enviados aguardando resposta max3)", global.contSend)
    console.log(`**PASSO 2 - total de mensagens enviadas do cliente:${client?.info?.wid.user}`, totMessageSend)
    console.log(`**PASSO 3 - Verifica shippingCampaign(se tem algum paciente para enviar)`, shippingCampaign?.cellphone)


    if (totMessageSend >= maxLimitSendAgent && (shippingCampaign?.prioritysend == null || shippingCampaign?.prioritysend == undefined)) {
      console.log(`LIMITE DIÁRIO ATINGIDO,Id:${agent.id} Agent: ${agent.name} Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendAgent}`)
      return
    }
    if (await TimeSchedule() == false) {
      return
    }
    await verifyContSend()
    if (shippingCampaign) {
      console.log("*** PASSO 4")
      if (global.contSend < 3) {
        if (global.contSend < 0)
          global.contSend = 0
        try {
          //verificar o numero
          console.log("*** PASSO 5")
          if (!shippingCampaign.prioritysend)
            verifycontsend = await verifyClientSend(client, shippingCampaign?.cellphone)
          //console.log("*** PASSO 5.0", verifycontsend.id, "cellphone:", verifycontsend.cellphone, "name", verifycontsend.name)
          if (verifycontsend)
            return
          console.log("*** PASSO 5.1")
          const validationCellPhone = await verifyNumber(client, shippingCampaign?.cellphone)
          console.log("*** PASSO 5.2")
          if (validationCellPhone) {
            console.log("*** PASSO 5.3")
            verifyChat = await Chat.query()
              .where('interaction_id', shippingCampaign?.interaction_id)
              .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
              .andWhere('shippingcampaigns_id', shippingCampaign?.id).first()

            if (verifyChat == undefined) {
              console.log("*** PASSO 6")
              let returnResponse: any = {}
              await client.sendMessage(validationCellPhone, shippingCampaign.message)
                .then(async (response) => {
                  console.log("*** PASSO 7")
                  returnResponse = response
                  global.contSend++
                  shippingCampaign.messagesent = true
                  shippingCampaign.phonevalid = true
                  shippingCampaign.cellphoneserialized = validationCellPhone
                  await shippingCampaign.save()
                  const bodyChat = {
                    interaction_id: shippingCampaign.interaction_id,
                    interaction_seq: shippingCampaign.interaction_seq,
                    idexternal: shippingCampaign.idexternal,
                    reg: shippingCampaign.reg,
                    name: shippingCampaign.name,
                    cellphone: shippingCampaign.cellphone,
                    cellphoneserialized: shippingCampaign.cellphoneserialized,
                    message: shippingCampaign.message,
                    shippingcampaigns_id: shippingCampaign.id,
                    chatname: agent.name,
                    chatnumber: client.info.wid.user
                  }
                  await Chat.create(bodyChat)
                  await Talk.create({
                    cellphone: await extractCellphone(shippingCampaign.cellphone),
                    chatnumber: client.info.wid.user,
                    message: shippingCampaign.message.slice(0, 999),
                    type: "to"
                  })

                  console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "agent", agent.name)
                  if (agent.statusconnected == false || agent.status !== 'CONNECTED')
                    await Agent.query().where('id', agent.id).update({ statusconnected: true, status: 'CONNECTED' })
                }).catch(async (error) => {
                  console.log("*** PASSO 8")
                  const state = await client.getState()
                  await Agent.query().where('id', agent.id).update({ statusconnected: false, status: state })
                  await Log.create({ name: 'sendMessage', message: error, description: "SendMessage.ts. linha:120 - Whatsapp Bugado catch" })
                })
              if (Object.keys(returnResponse).length === 0) {
                console.log("*** PASSO 9")
                await Log.create({ name: 'sendMessage', message: error, description: "SendMessage.ts. linha:120 - Whatsapp Bugado depois deo catch" })
                await Agent.query().where('id', agent.id).update({ statusconnected: false })
              }

            }

          } else {//número é inválido
            shippingCampaign.phonevalid = false
            const result = await shippingCampaign.save()
            console.log(`*** PASSO 10: id:${result.id}, nome:${result.name}, fone:${result.cellphone}, phonevalid:${result.phonevalid}`)
          }
        }
        catch (error) {
          console.log("ERRO 1500:::", error)
          await Log.create({ name: 'sendMessageGeneral', message: "error", description: "SendMessage.ts. linha:131" })
        }
      }
    }
  }

  await sendMessages()

}
