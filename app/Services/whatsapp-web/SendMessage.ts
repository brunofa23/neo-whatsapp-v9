//import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Agent from 'App/Models/Agent';
import Chat from "App/Models/Chat"
import Interaction from 'App/Models/Interaction';
//import Shippingcampaign from 'App/Models/Shippingcampaign';
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { DateTime, VERSION } from 'luxon';
import { Client } from "whatsapp-web.js"

import { DateFormat, ExecutingSendMessage, GenerateRandomTime, TimeSchedule } from './util'

global.contSend = 0
//const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')
let resetContSend = DateTime.local()
let resetContSendBool = false
const shippingcampaignsController = new ShippingcampaignsController()

export default async (client: Client, agent: Agent) => {
console.log("passo 1")
  // async function _shippingCampaignList() {
  //   return await Shippingcampaign.query()
  //     .whereNull('phonevalid')
  //     .andWhere('messagesent', 0)
  //     .andWhere('created_at', '>', yesterday) // Certifique-se de usar a data correta aqui
  //     .whereNotExists((query) => {
  //       query.select('*').from('chats').whereRaw('shippingcampaigns.id = chats.shippingcampaigns_id');
  //     }).orderBy('prioritysend',"desc").first()

  // }

  async function verifyClientSend(client, cellphone){

    const teste = Chat.query()
    .where('cellphone', cellphone)
    .andWhere('created_at', '>', dayBefore5)
    .andWhere('chatnumber', client.info.wid.user)

    console.log("passo 7", teste.toQuery())

    return await Chat.query()
       .where('cellphone', cellphone)
       .andWhere('created_at', '>', dayBefore5)
       .andWhere('chatnumber', client.info.wid.user).first()
    // if (verifyClientSend)
    //   return null

  }
   // const verifyClientSend = await Chat.query()
    //   .where('cellphone', cellphone)
    //   .andWhere('created_at', '>', dayBefore5)
    //   .andWhere('chatnumber', client.info.wid.user).first()

    // if (verifyClientSend)
    //   return null

  async function verifyContSend() {
    if (global.contSend >= 3) {
      if (resetContSendBool == false) {
        resetContSend = DateTime.local().plus({ minutes: 6 })
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

  // async function totalInteractionSend(id) {
  //   const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
  //   const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
  //   try {
  //     const maxsendlimit = await Interaction.query().select('maxsendlimit').where("id", id).first()
  //     const totalSend = await Chat.query()
  //       .where('interaction_id', id)
  //       .andWhereBetween('created_at', [dateStart, dateEnd])
  //       .count('* as total').first()
  //     if (totalSend?.$extras.total < maxsendlimit.maxsendlimit || maxsendlimit == null)
  //       return false
  //     else return true
  //   } catch (error) {
  //     throw error
  //   }
  // }


//********************************************************************* */
async function sendMessages() {
  console.log("passo 2")
    const totMessageSend = await countLimitSendMessage()
    console.log("passo 3", totMessageSend)
    const maxLimitSendAgent = await maxLimitSendMessageAgent(agent.id)
    console.log("passo 4", maxLimitSendAgent)
    const shippingCampaign = await shippingcampaignsController.patientToSend()
    console.log("passo 5", shippingCampaign)
    let verifyChat
    let verifycontsend
    //let verifycontsend

    // if(shippingCampaign)
    //    verifycontsend = await verifyClientSend(client, shippingCampaign?.cellphone)

    // if(verifycontsend){
    //   console.log("Validando se existe mensagem enviada 5559")
    //   return
    // }

    if (totMessageSend >= maxLimitSendAgent) {
      console.log(`LIMITE DIÁRIO ATINGIDO, Agent: ${agent.name} Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendAgent}`)
      return
    }
    if (await TimeSchedule() == false) {
      return
    }
    await verifyContSend()


    // if (shippingCampaign?.interaction_id) {
    //   if (await totalInteractionSend(shippingCampaign?.interaction_id)) {
    //     console.log("Limite de Interação atingida...")
    //     return
    //   }
    // }
    //console.log("SHIPPING>>", shippingCampaign)
    if (shippingCampaign) {
      console.log("passo 6")
      if (global.contSend < 3) {
        if (global.contSend < 0)
          global.contSend = 0
        try {
          //verificar o numero
          if(!shippingCampaign.prioritysend){
            console.log("não é prioridade ....5000")
            verifycontsend = await verifyClientSend(client, shippingCampaign?.cellphone)
          }
          console.log("passo 7")
          if(verifycontsend)
            {
              console.log("passei na verificação se existe 558745")
              return
            }
            console.log("passo 8")
          const validationCellPhone = await verifyNumber(client, shippingCampaign?.cellphone)

          if (validationCellPhone) {
            verifyChat = await Chat.query()
              .where('interaction_id', shippingCampaign?.interaction_id)
              .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
              .andWhere('shippingcampaigns_id', shippingCampaign?.id).first()

              console.log("passo 9")
            if (verifyChat == undefined) {
              console.log("passo 10")
              await client.sendMessage(validationCellPhone, shippingCampaign.message)
                .then(async (response) => {
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
                  console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "agent", agent.name)

                  if (agent.statusconnected == false)
                    await Agent.query().where('id', agent.id).update({ statusconnected: true })
                }).catch(async (error) => {
                  console.log("ERRO 1452:::", error)
                })

            }

          } else {//número é inválido
            shippingCampaign.phonevalid = false
            await shippingCampaign.save()
          }
        }
        catch (error) {
          console.log("ERRO 1555555:::", error)
        }
      }
    }
  }

  await sendMessages()

}
