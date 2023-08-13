import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import Chat from "App/Models/Chat"
import Shippingcampaign from "App/Models/Shippingcampaign"
import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
import { Client } from "whatsapp-web.js"

import moment = require('moment');
import { GenerateRandomTime, DateFormat, TimeSchedule, ExecutingSendMessage } from './util'
import { DateTime } from 'luxon';
import Config from 'App/Models/Config';

global.contSend = 0
let resetContSend = DateTime.local()
let resetContSendBool = false
const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE)
const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END)

export default async (client: Client) => {

  async function _shippingCampaignList() {
    console.log("2 - PASSANDO PELO SHIPPING CAMPAIN")
    return await Shippingcampaign.query()
      .whereNull('phonevalid')
      .andWhere('created_at', '>=', yesterday).first()
  }

  async function sendMessages() {
    setInterval(async () => {
      console.log("1 - ENTREI NO SEND MESSAGES...")

      if (await !TimeSchedule())
        return

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

      const shippingCampaign = await _shippingCampaignList()

      if (shippingCampaign) {
        if (global.contSend < 3) {
          if (global.contSend < 0)
            global.contSend = 0
          try {
            //verificar o numero
            const validationCellPhone = await verifyNumber(client, shippingCampaign?.cellphone)
            console.log(`3 - VALIDAÇÃO DE TELEFONE DO PACIENTE:${shippingCampaign?.name}:`, validationCellPhone)
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
                  console.log("ERRRRO:::", error)
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

      console.log("4 - SAI DO SEND MESSAGES...")

    }, await GenerateRandomTime(startTimeSendMessage, endTimeSendMessage, '----Time Send Message'))
  }

  await sendMessages()

}




// import { typeServerConfig } from '@ioc:Adonis/Core/Server';
// import Chat from "App/Models/Chat"
// import Shippingcampaign from "App/Models/Shippingcampaign"
// import { verifyNumber } from 'App/Services/whatsapp-web/VerifyNumber';
// import { Client } from "whatsapp-web.js"

// import moment = require('moment');
// import { GenerateRandomTime, DateFormat, TimeSchedule, ExecutingSendMessage } from './util'
// import { DateTime } from 'luxon';
// import Config from 'App/Models/Config';

// global.contSend = 0
// let executingSendMessage2 = false
// let resetContSend = DateTime.local()
// let resetContSendBool = false
// const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
// const startTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE)
// const endTimeSendMessage = parseInt(process.env.EXECUTE_SEND_MESSAGE_END)

// export default async (client: Client) => {

//   // await sendMessageteste()
//   // async function sendMessageteste() {
//   //   console.log("ESTOU FORA DO TESTE")
//   //   //*********************************************** */


//   //   setInterval(async () => {
//   //     const executingSendMessage = await Config.find('executingSendMessage')
//   //     if (executingSendMessage?.valuebool) {
//   //       console.log("EXECUTING SEND MESSAGE OCUPADA", executingSendMessage?.valuebool)
//   //       return
//   //     }

//   //     console.log("ESTOU DENTRO DO TESTE...")
//   //     await ExecutingSendMessage(true)

//   //     const shippingCampaignList = await Shippingcampaign.query()
//   //       .whereNull('phonevalid')
//   //       .andWhere('created_at', '>=', yesterday)

//   //     for (const row of shippingCampaignList) {
//   //       console.log("VALOR:::", row)
//   //       console.log("Executando Sleep:")
//   //       row.phonevalid = true
//   //       await row.save()
//   //       await new Promise(resolve => setTimeout(resolve, 30000));
//   //     }

//   //     //console.log("SHIPPONG CAMPAIGN LIST", shippingCampaignMap)
//   //     await ExecutingSendMessage(false)

//   //   }, 10000)
//   //   //*********************************************************** */

//   // }


//   async function sendMessages() {
//     //await ExecutingSendMessage(true)
//     //const executingSendMessage = await Config.find('executingSendMessage')
//     // if (executingSendMessage?.valuebool) {
//     //   console.log("EXECUTING SEND MESSAGE OCUPADA", executingSendMessage?.valuebool)
//     //   return
//     // }


//     setInterval(async () => {

//       if (await !TimeSchedule())
//         return

//       const shippingCampaignList = await Shippingcampaign.query()
//         .whereNull('phonevalid')
//         .andWhere('created_at', '>=', yesterday)

//       const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
//       const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
//       const maxLimitSendMessage = await Shippingcampaign.query()
//         .where('messagesent', '=', '1')
//         .andWhereBetween('created_at', [dateStart, dateEnd])

//       if (maxLimitSendMessage.length >= parseInt(process.env.MAX_LIMIT_SEND_MESSAGE)) {
//         console.log(`LIMITE MÁXIMO DIÁRIO DE ENVIOS ATINGIDOS:${process.env.MAX_LIMIT_SEND_MESSAGE}`)
//         return
//       }

//       // const shippingCampaignMap = shippingCampaignList.map(campaign => {
//       //   return { id: campaign.id, cellphone: campaign.cellphone, name: campaign.name, phonevalid: campaign.phonevalid };
//       // });
//       // console.log("SHIPPONG CAMPAIGN LIST", shippingCampaignMap)


//       for (const dataRow of shippingCampaignList) {
//         console.log("Entrei no SendMessages...")
//         const time = await GenerateRandomTime(20, 30)
//         //*************************** */
//         if (global.contSend < 3 && executingSendMessage2 == false) {

//           if (global.contSend < 0) { global.contSend = 0 }
//           try {
//             //verificar o numero
//             const validationCellPhone = await verifyNumber(client, dataRow.cellphone)
//             console.log(`VALIDAÇÃO DE TELEFONE DO PACIENTE:${dataRow.name}:`, validationCellPhone)

//             if (validationCellPhone) {
//               executingSendMessage2 = true

//               await client.sendMessage(validationCellPhone, dataRow.message)
//                 .then(async (response) => {
//                   global.contSend++
//                   dataRow.messagesent = true
//                   dataRow.phonevalid = true
//                   dataRow.cellphoneserialized = validationCellPhone
//                   await dataRow.save()

//                   const bodyChat = {
//                     interaction_id: dataRow.interaction_id,
//                     interaction_seq: dataRow.interaction_seq,
//                     idexternal: dataRow.idexternal,
//                     reg: dataRow.reg,
//                     name: dataRow.name,
//                     cellphone: dataRow.cellphone,
//                     cellphoneserialized: dataRow.cellphoneserialized,
//                     message: dataRow.message,
//                     shippingcampaigns_id: dataRow.id,
//                     chatname: process.env.CHAT_NAME

//                   }
//                   await Chat.create(bodyChat)
//                   await new Promise(resolve => setTimeout(resolve, time));
//                   console.log("Mensagem enviada:", dataRow.name, "cellphone", dataRow.cellphoneserialized, "phonevalid", dataRow.phonevalid)

//                   executingSendMessage2 = false

//                 }).catch(async (error) => {
//                   console.log("ERRRRO:::", error)
//                   executingSendMessage2 = false
//                 })
//             } else {//número é inválido
//               dataRow.phonevalid = false
//               await dataRow.save()
//             }



//           }
//           catch (error) {
//             console.log("ERRO:::", error)
//             executingSendMessage2 = false
//           }
//         } else if (global.contSend >= 3) {
//           if (resetContSendBool == false) {
//             resetContSend = DateTime.local().plus({ minutes: 4 })
//             resetContSendBool = true
//           }
//           else if (resetContSend <= DateTime.local()) {
//             resetContSendBool = false
//             global.contSend = 0
//           }
//         }
//         //console.log("valor do contSend", global.contSend)
//         //****************************** */
//       }
//       //await ExecutingSendMessage(false)

//     }, await GenerateRandomTime(startTimeSendMessage,
//       endTimeSendMessage, '----Time Send Message'))

//     //await ExecutingSendMessage(false)
//   }

//   await sendMessages()

// }
