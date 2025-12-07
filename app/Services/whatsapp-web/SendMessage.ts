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
//const yesterday = DateTime.local().toFormat('yyyy-MM-dd 00:00')
const dayBefore5 = DateTime.local().minus({ days: 5 }).toFormat('yyyy-MM-dd 00:00')
let resetContSend = DateTime.local()
let resetContSendBool = false
const shippingcampaignsController = new ShippingcampaignsController()

export default async (client: Client, agent: Agent) => {
  // ------------------------------------------------------------------
  // Helper: verifica se já foi enviado algo para esse celular
  // nos últimos 5 dias (evitar envio duplicado para o mesmo paciente)
  // ------------------------------------------------------------------
  async function verifyClientSend(client: Client | null, cellphone: string) {
    if (client?.info?.wid) {
      const query = Chat.query()
        .where('cellphone', cellphone)
        .andWhere('created_at', '>', dayBefore5)
        .andWhere('chatnumber', client.info.wid.user)

      return await query.first()
    } else {
      console.log('cliente não conectado')
      return
    }
  }

  // ------------------------------------------------------------------
  // Contador de envios em sequência (global.contSend)
  // Quando >= 3, dá uma pausa de 4 minutos
  // ------------------------------------------------------------------
  async function verifyContSend() {
    if (global.contSend >= 3) {
      if (resetContSendBool === false) {
        resetContSend = DateTime.local().plus({ minutes: 4 })
        resetContSendBool = true
      } else if (resetContSend <= DateTime.local()) {
        resetContSendBool = false
        global.contSend = 0
      }
    }
  }

  // ------------------------------------------------------------------
  // Total já enviado no dia (pelo agente) - regra de limite diário
  // ------------------------------------------------------------------
  async function countLimitSendMessage() {
    const value = await shippingcampaignsController.maxLimitSendMessage(agent)
    return value
  }

  // ------------------------------------------------------------------
  // Limite máximo diário configurado no Agent
  // ------------------------------------------------------------------
  async function maxLimitSendMessageAgent(id: number) {
    const agentMaxLimitSend = await Agent.query().where('id', id).first()
    if (agentMaxLimitSend == undefined || agentMaxLimitSend?.max_limit_message == undefined) return 0
    return agentMaxLimitSend?.max_limit_message
  }

  // ------------------------------------------------------------------
  // Verifica se já existe Chat para esse envio (interaction_id, seq, etc.)
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
  // Helper: decide se envia via Engine (wwebjs) ou via client legado
  // cfg:
  //   - text?: string
  //   - mediaFilePath?: string
  //   - caption?: string
  // ------------------------------------------------------------------
  async function sendViaProvider(
    agent: Agent,
    client: Client | null,
    to: string,
    cfg: { text?: string; mediaFilePath?: string; caption?: string }
  ): Promise<any> {
    // Caminho novo: Engine (provider_type = 'wwebjs')
    if ((agent as any).providerType === 'wwebjs' || (agent as any).provider_type === 'wwebjs') {
      // Envio com anexo
      if (cfg.mediaFilePath) {
        return whatsAppEngine.sendMedia(agent.id, to, cfg.mediaFilePath, cfg.caption)
      }

      // Envio de texto simples
      if (cfg.text) {
        return whatsAppEngine.sendText(agent.id, to, cfg.text)
      }

      throw new Error('Nada para enviar (nem texto, nem mediaFilePath)')
    }

    // Caminho antigo (legacy): usa o client direto
    if (!client) {
      throw new Error('Client wwebjs não informado para provider legacy')
    }

    // Com anexo no fluxo antigo
    if (cfg.mediaFilePath) {
      const media = MessageMedia.fromFilePath(cfg.mediaFilePath)
      return client.sendMessage(to, media, {
        caption: cfg.caption,
        sendMediaAsDocument: true,
      })
    }

    // Só texto no fluxo antigo
    if (cfg.text) {
      return client.sendMessage(to, cfg.text)
    }

    throw new Error('Nada para enviar (nem texto, nem mediaFilePath)')
  }

  //********************************************************************* */
  async function sendMessages() {
    const totMessageSend = await countLimitSendMessage()
    const maxLimitSendAgent = await maxLimitSendMessageAgent(agent.id)
    const shippingCampaign = await shippingcampaignsController.patientToSend(agent)

    let verifyChat
    let verifycontsend

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
          // verificar o numero (evitar reenvio para o mesmo cliente se não for prioridade)
          if (!shippingCampaign.prioritysend)
            verifycontsend = await verifyClientSend(client, shippingCampaign?.cellphone)

          if (verifycontsend) return

          const validationCellPhone = await verifyNumber(client, shippingCampaign?.cellphone)

          if (validationCellPhone === 'INVALID') {
            // Número inválido
            shippingCampaign.phonevalid = false
            await shippingCampaign.save()
            return
          } else if (validationCellPhone === null) {
            // Erro temporário
            console.log('Erro Temporário, repetir:', shippingCampaign.cellphone)
          } else {
            // Telefone validado
            verifyChat = await VerifyChat(shippingCampaign)

            if (verifyChat == undefined) {
              let returnResponse: any = {}

              // ------------------------------------------------------
              // Monta a configuração de envio:
              //  - text: mensagem de texto
              //  - mediaFilePath: caminho do arquivo (se tiver anexo)
              //  - caption: legenda (se tiver anexo)
              // ------------------------------------------------------
              let cfg: { text?: string; mediaFilePath?: string; caption?: string } = {
                text: shippingCampaign.message,
              }

              // Se for interação com anexo (ex: interaction_id === 3)
              if (shippingCampaign.interaction_id === 3) {
                const check = await checkExistFile(shippingCampaign?.file_path)
                if (check) {
                  console.log('ENVIAR MENSAGEM COM ANEXO')
                  cfg = {
                    mediaFilePath: check,
                    caption: shippingCampaign.message,
                  }
                } else {
                  console.log('Arquivo não encontrado; enviando apenas texto...')
                }
              }

              try {
                // 🔹 Decide Engine x Legacy internamente
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
                  cellphone: validationCellPhone, // await extractCellphone(shippingCampaign.cellphone),
                  chatnumber: client?.info?.wid?._serialized || agent.number_phone,
                  reg: shippingCampaign.reg,
                  chat_id: chat.id,
                  message: shippingCampaign.message.slice(0, 999),
                  type: 'to',
                })

                console.log(
                  'Mensagem enviada:',
                  shippingCampaign.name,
                  'cellphone',
                  shippingCampaign.cellphoneserialized,
                  'agent',
                  agent.name
                )

                if (agent.statusconnected == false || agent.status !== 'CONNECTED') {
                  await Agent.query()
                    .where('id', agent.id)
                    .update({ statusconnected: true, status: 'CONNECTED' })
                }
              } catch (error) {
                // erro no envio via provider (Engine ou Legacy)
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

              // Se por algum motivo não veio nenhuma resposta do provider
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
          // Erro genérico na função
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
