import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { Client } from "whatsapp-web.js"

import moment = require('moment');
import { GenerateRandomTime, DateFormat, TimeSchedule, ExecutingSendMessage } from './util'
import { DateTime } from 'luxon';
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';

global.contSend = 0
const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE)
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END)

export default async (client: Client) => {
  let resetContSend = DateTime.local()
  let resetContSendBool = false

  async function _shippingCampaignList() {
    // console.log("2 - PASSANDO PELO SHIPPING CAMPAIGN")
    // console.log("QUERY DO SENDMESSAGE::>>", await Shippingcampaign.query()
    //   .whereNull('phonevalid')
    //   .andWhere('created_at', '>', yesterday).toQuery())

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
  const maxLimitSendMessage: number = parseInt(process.env.MAX_LIMIT_SEND_MESSAGE)

  async function sendMessages() {
    setInterval(async () => {
      const totMessageSend = await countLimitSendMessage()
      if (totMessageSend >= maxLimitSendMessage) {
        console.log(`LIMITE DE ENVIO DIÁRIO ATINGIDO, Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendMessage}`)
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
      //console.log("4 - SAI DO SEND MESSAGES...")
    }, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))
  }

  await sendMessages()

}



