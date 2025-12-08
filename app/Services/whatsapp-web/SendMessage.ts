import ShippingcampaignsController from 'App/Controllers/Http/ShippingcampaignsController'
import Agent from 'App/Models/Agent'
import Chat from 'App/Models/Chat'
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber'
import { DateTime } from 'luxon'
import { Client, MessageMedia } from 'whatsapp-web.js'
import { TimeSchedule, checkExistFile } from './util'
import Log from 'App/Models/Log'
import Talk from 'App/Models/Talk'
import whatsAppEngine from 'App/Services/whatsapp/core/WhatsAppEngine'

global.contSend = 0
const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')
let resetContSend = DateTime.local()
let resetContSendBool = false
const shippingcampaignsController = new ShippingcampaignsController()

export default async (client: Client | null, agent: Agent) => {
  // ------------------------------------------------------------------
  // Helper: verifica se já foi enviado algo para esse celular
  // nos últimos 5 dias (evitar envio duplicado)
  // ------------------------------------------------------------------
  async function verifyClientSend(agent: Agent | null, cellphone: string) {
    if (client?.info?.wid) {
      const query = Chat.query()
        .where('cellphone', cellphone)
        .andWhere('created_at', '>', dayBefore5)
        .andWhere('chatnumber', agent?.number_phone)

      return await query.first()
    } else {
      return
    }
  }

  // ------------------------------------------------------------------
  // Contador de envios em sequência: quando >= 3, pausa 4 min
  // ------------------------------------------------------------------
  async function verifyContSend() {
    if (global.contSend >= 3) {
      if (!resetContSendBool) {
        resetContSend = DateTime.local().plus({ minutes: 4 })
        resetContSendBool = true
      } else if (resetContSend <= DateTime.local()) {
        resetContSendBool = false
        global.contSend = 0
      }
    }
  }

  // ------------------------------------------------------------------
  // Total já enviado hoje pelo agente
  // ------------------------------------------------------------------
  async function countLimitSendMessage() {
    return await shippingcampaignsController.maxLimitSendMessage(agent)
  }

  // ------------------------------------------------------------------
  // Máximo diário configurado no agent
  // ------------------------------------------------------------------
  async function maxLimitSendMessageAgent(id: number) {
    const agentMaxLimitSend = await Agent.query().where('id', id).first()
    if (!agentMaxLimitSend?.max_limit_message) return 0
    return agentMaxLimitSend.max_limit_message
  }

  // ------------------------------------------------------------------
  // Verifica se já existe chat para esse envio (duplicação)
  // ------------------------------------------------------------------
  async function VerifyChat(shippingCampaign: any) {
    const query = Chat.query()
      .where('interaction_id', shippingCampaign?.interaction_id)
      .andWhere('interaction_seq', shippingCampaign?.interaction_seq)
      .andWhere('shippingcampaigns_id', shippingCampaign?.id)
      .andWhereNull('excluded')

    return await query.first()
  }

  // ------------------------------------------------------------------
  // 🔥 CORREÇÃO IMPORTANTE AQUI:
  // Decide se envia via Engine (wwebjs OU megaapi)
  //
  // 👉 Agora suporta provider_type = 'megaapi'
  //
  // ------------------------------------------------------------------
  async function sendViaProvider(
    agent: Agent,
    client: Client | null,
    to: string,
    cfg: { text?: string; mediaFilePath?: string; caption?: string }
  ): Promise<any> {
    console.log("PASSEI SEND VIA PROVIDER 19566")
    // 🚀 CAMINHO NOVO – Provider via Engine:
    // wwebjs OU megaapi
    if (
      (agent as any).provider_type === 'wwebjs' ||
      (agent as any).provider_type === 'megaapi'
    ) {
      // Envio com anexo
      if (cfg.mediaFilePath) {
        return whatsAppEngine.sendMedia(agent.id, to, cfg.mediaFilePath, cfg.caption)
      }

      // Envio de texto
      if (cfg.text) {
        return whatsAppEngine.sendText(agent.id, to, cfg.text)
      }

      throw new Error('Nada para enviar (nem texto, nem mediaFilePath)')
    }

    // ----------------------------------------------------------
    // 🔥 CAMINHO ANTIGO (LEGACY) – SOMENTE para quem AINDA usa client
    // ----------------------------------------------------------
    if (!client) {
      throw new Error('Client wwebjs não informado para provider legacy')
    }

    // Com anexo no legacy
    if (cfg.mediaFilePath) {
      const media = MessageMedia.fromFilePath(cfg.mediaFilePath)
      return client.sendMessage(to, media, {
        caption: cfg.caption,
        sendMediaAsDocument: true,
      })
    }

    // Só texto legacy
    if (cfg.text) {
      return client.sendMessage(to, cfg.text)
    }

    throw new Error('Nada para enviar (nem texto, nem mediaFilePath)')
  }

  //********************************************************************* */
  async function sendMessages() {
    console.log("PASSEI SENDMESSAGE 19566")
    const totMessageSend = await countLimitSendMessage()
    const maxLimitSendAgent = await maxLimitSendMessageAgent(agent.id)
    const shippingCampaign = await shippingcampaignsController.patientToSend(agent)

    let verifyChat
    let verifyClientsend

    if (
      totMessageSend >= maxLimitSendAgent &&
      (shippingCampaign?.prioritysend == null ||
        shippingCampaign?.prioritysend == undefined ||
        shippingCampaign?.prioritysend == false)
    ) {
      console.log(
        `LIMITE DIÁRIO ATINGIDO,Id:${agent.id} Agent: ${agent.name} Enviados:${totMessageSend} - Limite Máximo:${maxLimitSendAgent}`
      )
      return
    }

    if ((await TimeSchedule()) == false) {
      return
    }

    await verifyContSend()

    if (shippingCampaign) {
      if (global.contSend <= 3) {
        if (global.contSend < 0) global.contSend = 0

        try {

          console.log("@@@@@@@AGENTE oo123121:", agent.number_phone)
          if (!shippingCampaign.prioritysend)
            verifyClientsend = await verifyClientSend(agent.number_phone, shippingCampaign?.cellphone)

          if (verifyClientsend) return

          let validationCellPhone = shippingCampaign.cellphone

          // console.log("AGENTE 1222@@@@@$$$$>", agent.provider_type)
          // if ((agent as any).provider_type === 'megaapi') {
          //   // ⚠️ MegaAPI não valida número, assume direto
          //   validationCellPhone = shippingCampaign.cellphone
          //   console.log("ENTREI AQUI 555555>>", validationCellPhone, shippingCampaign.cellphone)
          // } else {
          //   // 🔥 Legacy + wwebjs continuam usando verifyNumber
          //   validationCellPhone = await verifyNumber(client, shippingCampaign?.cellphone)
          // }
          // console.log("CLIENTE 12@@@@@@@>>>", client)


          // if (validationCellPhone === 'INVALID') {
          //   shippingCampaign.phonevalid = false
          //   await shippingCampaign.save()
          //   return
          // } else
          if (validationCellPhone === null) {
            console.log('Erro Temporário, repetir:', shippingCampaign.cellphone)
          } else {
            verifyChat = await VerifyChat(shippingCampaign)

            if (!verifyChat) {
              let returnResponse: any = {}

              let cfg: { text?: string; mediaFilePath?: string; caption?: string } = {
                text: shippingCampaign.message,
              }

              if (shippingCampaign.interaction_id === 3) {
                const check = await checkExistFile(shippingCampaign?.file_path)
                if (check) {
                  cfg = {
                    mediaFilePath: check,
                    caption: shippingCampaign.message,
                  }
                }
              }

              try {
                // 🔥 **NOVO – envia por Engine**
                const response = await sendViaProvider(
                  agent,
                  client,
                  validationCellPhone,
                  cfg
                )


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
                  chatnumber: client?.info?.wid?.user || agent.number_phone,
                }

                const chat = await Chat.create(bodyChat)

                await Talk.create({
                  cellphone: validationCellPhone,
                  chatnumber: client?.info?.wid?._serialized || agent.number_phone,
                  reg: shippingCampaign.reg,
                  chat_id: chat.id,
                  message: shippingCampaign.message.slice(0, 999),
                  type: 'to',
                })

                if (agent.statusconnected == false || agent.status !== 'CONNECTED') {
                  await Agent.query()
                    .where('id', agent.id)
                    .update({ statusconnected: true, status: 'CONNECTED' })
                }
              } catch (error) {
                const state = client ? await client.getState() : 'ENGINE_OR_NO_CLIENT'
                await Agent.query().where('id', agent.id).update({
                  statusconnected: false,
                  status: state,
                })
                await Log.create({
                  name: 'sendMessage',
                  message: String(error),
                  description: 'SendMessage.ts - Erro no envio (sendViaProvider)',
                })
              }

              if (returnResponse && Object.keys(returnResponse).length === 0) {
                await Log.create({
                  name: 'sendMessage',
                  message: 'Resposta vazia do provider',
                  description: 'SendMessage.ts - retorno vazio após envio',
                })
                await Agent.query().where('id', agent.id).update({ statusconnected: false })
              }
            }
          }
        } catch (error) {
          await Log.create({
            name: 'sendMessageGeneral',
            message: String(error),
            description: 'SendMessage.ts. linha:131',
          })
        }
      }
    }
  }

  await sendMessages()
}
