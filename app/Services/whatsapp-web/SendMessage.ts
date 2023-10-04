import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Agent from 'App/Models/Agent';
import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { DateTime } from 'luxon';
import { Client } from "whatsapp-web.js"

import { DateFormat, ExecutingSendMessage, GenerateRandomTime, TimeSchedule } from './util'

global.contSend = 0
const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
let startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE)
let endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END)

export default async (client: Client) => {
  let resetContSend = DateTime.local()
  let resetContSendBool = false

  async function getAgent(chatName: string) {
    const agent = await Agent.findBy('name', chatName)
    if (!agent || agent == undefined) {
      console.log("Erro: Verifique o chatnumer")
      return
    }
    startTimeSendMessage = agent.interval_init_message
    endTimeSendMessage = agent.interval_final_message
    return agent
  }

  async function _shippingCampaignList() {
    return await Shippingcampaign.query()
      .whereNull('phonevalid')
      .andWhere('created_at', '>', yesterday).first()
  }

  async function verifyContSend() {
    if (global.contSend >= 3) {
      if (resetContSendBool == false) {
        resetContSend = DateTime.local().plus({ minutes: 5 })
        resetContSendBool = true
      }
      else if (resetContSend <= DateTime.local()) {
        resetContSendBool = false
        global.contSend = 0
      }
    }
  }

  async function countLimitSendMessage() {
    const shippingcampaignsController = new ShippingcampaignsController()
    const value = await shippingcampaignsController.maxLimitSendMessage()
    return value
  }
  async function sendMessages() {
    setInterval(async () => {
      const agent: Agent = await getAgent(process.env.CHAT_NAME)
      const totMessageSend = await countLimitSendMessage()

      //console.log("Max limit message:", agent.max_limit_message, "startTimeSendMessage:", startTimeSendMessage, "endTimeSendMessage:", endTimeSendMessage)
      if (totMessageSend >= agent.max_limit_message) {
        console.log(`LIMITE DE ENVIO DIÁRIO ATINGIDO, Enviados:${totMessageSend} - Limite Máximo:${agent.max_limit_message}`)
        return
      }
      if (await TimeSchedule() == false) {
        return
      }
      await verifyContSend()
      const shippingCampaign = await _shippingCampaignList()

      if (shippingCampaign) {
        if (global.contSend < 3) {
          if (global.contSend < 0)
            global.contSend = 0
          try {
            //verificar o numero
            const validationCellPhone = await verifyNumber(client, shippingCampaign?.cellphone)
            console.log(`VALIDAÇÃO DE TELEFONE DO PACIENTE:${shippingCampaign?.name}:`, validationCellPhone)
            if (validationCellPhone) {
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
                    chatname: process.env.CHAT_NAME
                  }
                  await Chat.create(bodyChat)
                  console.log("Mensagem enviada:", shippingCampaign.name, "cellphone", shippingCampaign.cellphoneserialized, "phonevalid", shippingCampaign.phonevalid)
                }).catch(async (error) => {
                  console.log("ERRO 1452:::", error)
                })
            } else {//número é inválido
              shippingCampaign.phonevalid = false
              await shippingCampaign.save()
            }
          }
          catch (error) {
            console.log("ERRO:::", error)
          }
        }
      }
    }, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))
  }

  await sendMessages()

}



