import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController';
import Agent from 'App/Models/Agent';
import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import Interaction from 'App/Models/Interaction';
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { DateTime } from 'luxon';
import { Client } from "whatsapp-web.js"

import { DateFormat, ExecutingSendMessage, GenerateRandomTime, TimeSchedule } from './util'

global.contSend = 0
const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')

export default async (client: Client, agent: Agent) => {
  let resetContSend = DateTime.local()
  let resetContSendBool = false
  const startTimeSendMessage = agent.interval_init_message
  const endTimeSendMessage = agent.interval_final_message

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

  async function totalInteractionSend(id) {
    const maxsendlimit = await Interaction.query().where("id", id)
    const totalSend = await Shippingcampaign.query().where('interaction_id', id).count('* as total').first()
    console.log("limite de interaction", maxsendlimit, 'total enviado', totalSend?.$extras.total)
  }



  async function sendMessages() {
    setInterval(async () => {

      await Agent.query().where('id', agent.id).update({ statusconnected: true })

      const totMessageSend = await countLimitSendMessage()
      if (totMessageSend >= agent.max_limit_message) {
        console.log(`LIMITE DE ENVIO DIÁRIO ATINGIDO, Enviados:${totMessageSend} - Limite Máximo:${agent.max_limit_message}`)
        return
      }
      if (await TimeSchedule() == false) {
        return
      }
      await verifyContSend()
      const shippingCampaign = await _shippingCampaignList()

      console.log("shipping campaign 1222", shippingCampaign)
      //await totalInteractionSend(shippingCampaign)


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
                    chatname: agent.name
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
