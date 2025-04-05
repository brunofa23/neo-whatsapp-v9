import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Agent from 'App/Models/Agent'
import { startAgent } from "../../Services/whatsapp-web/whatsappConnection"
import Chat from 'App/Models/Chat'
import { DateFormat } from '../../Services/whatsapp-web/util'
import { DateTime } from 'luxon'
import { startAgentChat } from "../../Services/whatsapp-web/whatsapp"
import Config from 'App/Models/Config'
import Application from '@ioc:Adonis/Core/Application'
import fs from 'fs';

//const fs = require('fs');
//const path = require('path');

// Função que retorna uma promessa para remover a pasta
function deleteFolder(pathFolder) {
  return new Promise((resolve, reject) => {
    fs.rm(pathFolder, { recursive: true }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
export default class AgentsController {
  public async index({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
    const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
    try {
      const data = await Agent.query().whereNull('deleted')
      const agents = []
      for (const agent of data) {
        const totMessage =
          await Chat.query()
            .where('chatname', agent.name)
            .andWhereBetween('created_at', [dateStart, dateEnd])
            .count('* as totMessage').first()

        agents.push({
          id: agent.id,
          name: agent.name,
          number_phone: agent.number_phone,
          interval_init_query: agent.interval_init_query,
          interval_final_query: agent.interval_final_query,
          interval_init_message: agent.interval_init_message,
          interval_final_message: agent.interval_final_message,
          max_limit_message: agent.max_limit_message,
          status: agent.status,
          statusconnected: agent.statusconnected,
          active: agent.active,
          default_chat: agent.default_chat,
          qrcode: agent.qrcode,
          company_id: agent.company_id,
          obs: agent.obs,
          totMessage: totMessage?.$extras.totMessage
        })
      }
      //console.log("Agentes", agents)
      return response.status(200).send(agents)
    } catch (error) {
      return error
    }

  }

  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Agent.fillable)
    body.interval_init_query = 1
    body.interval_final_query = 1
    body.active = 1
    try {
      const data = await Agent.create(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }

  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    console.log("conections.....", auth)
    await auth.use('api').authenticate()
    console.log("conections.....UPDATE")
    const body = request.only(Agent.fillable)
    try {
      const data = await Agent.query().where('id', params.id)
        .update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }

  public async connection({auth,params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      const valuedatetime = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      await Config.query().where('id', 'statusSendMessage').update({ valuedatetime: valuedatetime })
      await Agent.query()
        .where('id', params.id)
        .andWhereNull('deleted')
        .update({ statusconnected: false, qrcode: null })
      const agent = await Agent.query().where('id', params.id).first()
      let client
      if (agent) {
        if (agent.default_chat) {
          console.log(`Conectando Agente Default: ${agent.name}`)
          client = await startAgentChat(agent)
        }
        else {
          console.log(`Conectando Agente Envio: ${agent.name} `)
          client = await startAgent(agent)
        }
      }
      return response.status(201).send('Connected', client)

    } catch (error) {
      error
    }
  }


  public async connectionAll({auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    try {
      console.log("connection all acionado...")

      const valuedatetime = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      await Config.query().where('id', 'statusSendMessage').update({ valuedatetime: valuedatetime })

      await Agent.query()
        .whereNull('deleted')
        .update({ statusconnected: false, qrcode: null })
      const agents = await Agent.query()
        .where('active', true)
      for (const agent of agents) {
        if (agent) {
          if (agent.default_chat) {
            console.log(`Conectando Agente Default: ${agent.name} `)
            await startAgentChat(agent)
          }
          else {
            console.log(`Conectando Agente Envio: ${agent.name} `)
            await startAgent(agent)
          }
        }
      }
    } catch (error) {
      error
    }
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    console.log("passei no destroy....")


    await new Promise((resolve) => {
      setTimeout(async () => {
        console.log("Excluindo pasta...");
        const pathFolder =Application.tmpPath(`/sessions/session-${params.id}`) //`.wwebjs_auth/session-${agent.id}`;

        if (fs.existsSync(pathFolder)) {
          try {
            await deleteFolder(pathFolder); // Função que aguarda a exclusão da pasta
            console.log(`DIRETÓRIO DELETADO: session-${params.id}`);

            // Deleta o agente do banco
            await Agent.query().where('id', params.id).delete();
            resolve(); // Resolve a promessa após a exclusão
          } catch (err) {
            console.error(err);
            resolve(); // Resolve a promessa em caso de erro para não bloquear o loop
          }
        } else {
          resolve(); // Resolve se a pasta não existir
        }
      }, 10000); // Atraso de 10 segundos
    });


    const data = await Agent.query().where('id', params.id)
      .update({ deleted: true, active: null, status: null, number_phone: null, qrcode: null })
    return response.status(201).send(data)

  }

  // public async destroyFullAgents() {
  //   const agents = await Agent.query().where('deleted', true)
  //   for (const agent of agents) {
  //     setTimeout(() => {
  //       console.log("Excluindo pasta...")
  //       const pathFolder = `.wwebjs_auth/session-${agent.id}`
  //       if (fs.existsSync(pathFolder)) {
  //         fs.rm(pathFolder, { recursive: true }, (err) => {
  //           if (err) {
  //             console.error(err)
  //           } else {
  //             console.log(`DIRETORIO DELETADO: session-${agent.id}`)
  //             await Agent.query().where('id',agent.id).delete()
  //           }
  //         })
  //       }
  //     }, 10000)

  //   }

  // }

  public async destroyFullAgents() {

    const agents = await Agent.query().where('deleted', true);
    for (const agent of agents) {
      // Use um atraso de 10 segundos com Promise para usar await
      await new Promise((resolve) => {
        setTimeout(async () => {
          console.log("Excluindo pasta...");
          const pathFolder =Application.tmpPath(`/sessions/session-${agent.id}`) //`.wwebjs_auth/session-${agent.id}`;
          if (fs.existsSync(pathFolder)) {
            try {
              await deleteFolder(pathFolder); // Função que aguarda a exclusão da pasta
              console.log(`DIRETÓRIO DELETADO: session-${agent.id}`);

              // Deleta o agente do banco
              await Agent.query().where('id', agent.id).delete();
              resolve(); // Resolve a promessa após a exclusão
            } catch (err) {
              console.error(err);
              resolve(); // Resolve a promessa em caso de erro para não bloquear o loop
            }
          } else {
            resolve(); // Resolve se a pasta não existir
          }
        }, 10000); // Atraso de 10 segundos
      });
    }
    await Agent.query().where('deleted', true).delete()
  }



}
