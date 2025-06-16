import { Env } from '@ioc:Adonis/Core/Env';
import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat';
import Interaction from 'App/Models/Interaction';
import Response from 'App/Models/Response';
import { DateTime } from 'luxon';
import moment from 'moment';
import { cancelSchedule, session } from '../../Services/requestExternal/request'
import { DateFormat } from '../../Services/whatsapp-web/util'
import ResponsesController from './ResponsesController';
import Shippingcampaign from 'App/Models/Shippingcampaign';
export default class DatasourcesController {


  async DataSource(date: string, interaction_id: number = 0, unit: number = 0): Promise<any[]> {
    try {
      let schedulePatientsArray: any[] = [];
      let serviceEvaluationArray: any[] = [];

      // Executa interações específicas diretamente
      if (interaction_id === 1) {
        return await this.scheduledPatients(date, unit);
      }

      if (interaction_id === 2) {
        return await this.serviceEvaluation();
      }

      const interactionList = await Interaction.query().where('status', 1);

      for (const interaction of interactionList) {
        switch (interaction.id) {
          case 1:
            schedulePatientsArray = await this.scheduledPatients(date, unit);
            break;
          case 2:
            serviceEvaluationArray = await this.serviceEvaluation();
            break;
          case 3:
            console.log("Teste de envio amadurecimento do chip", interaction.name);
            break;
          default:
            console.warn(`ID de interação não tratado: ${interaction.id}`);
            break;
        }
      }

      return [...schedulePatientsArray, ...serviceEvaluationArray];

    } catch (error) {
      console.error('Erro na DataSource:', error);
      throw error;
    } finally {
      // Fecha a conexão no final, com segurança
      try {
        await Database.manager.close('mssql');
      } catch (closeError) {
        console.warn('Erro ao fechar conexão MSSQL:', closeError);
      }
    }
  }


  public async scheduledPatients(dateStr: string, unit: number = 0): Promise<any[]> {
    const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'America/Sao_Paulo' });
    if (!date.isValid) {
      throw new Error('Formato de data inválido. Use yyyy-MM-dd');
    }
    const dateStart = date.startOf('day').toFormat('yyyy-MM-dd HH:mm')
    const dateEnd = date.endOf('day').toFormat('yyyy-MM-dd HH:mm')
    // Separar função greeting para método da classe
    const greeting = async (message: string): Promise<string> => {
      const responseList = new ResponsesController();
      // Pega array de strings
      const greetings = await responseList.index({ local: 'greeting' });
      const presentations = await responseList.index({ local: 'presentation' });
      // Substituir placeholders na mensagem
      return message
        .replace('{greeting}', greetings)
        .replace('{presentation}', presentations);
    };

    const pacQueryModel = await Interaction.query().where('id', 1).first();

    if (!pacQueryModel) {
      throw new Error('Consulta para scheduledPatients não encontrada');
    }

    // Definir query de acordo com o ambiente
    const env = process.env.NODE_ENV;
    const pacQuery = env === 'development' ? pacQueryModel.querydev : pacQueryModel.query;

    if (!pacQuery) {
      throw new Error('Query inválida para scheduledPatients');
    }

    try {
      let query = pacQuery
        .replace(/\{dateStart\}/g, dateStart)
        .replace(/\{dateEnd\}/g, dateEnd)
      if (unit > 0)
        query = query.replace('1=1', ` emp_cod=${unit}`)

      const result = await Database.connection('mssql')
        .rawQuery(query)

      // Processar mensagens com greeting
      for (const data of result) {
        if (data.message && typeof data.message === 'string') {
          data.message = await greeting(data.message);
        }
      }
      return result;
    } catch (error) {
      console.error('Erro em scheduledPatients:', error);
      throw error;
    } finally {
      await Database.manager.close('mssql');
    }
  }

  

  async confirmSchedule(chat: Chat, chatOtherFields: String = "") {

    const dateNow = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    const dateSchedule = DateTime.fromFormat(chatOtherFields['schedule'], 'yyyy-MM-dd HH:mm')//converte string para data
    const startOfDay = await DateFormat("yyyy-MM-dd 00:00", dateSchedule)
    const endOfDay = await DateFormat("yyyy-MM-dd 23:59", dateSchedule)

    try {
      const query = await Database.connection('mssql')
        .from('agm')
        .where('agm_pac', chat.reg)
        .whereBetween('agm_hini', [startOfDay, endOfDay])
        .whereNotIn('agm_stat', ['C', 'B'])
        .whereNotIn('agm_confirm_stat', ['C'])
        .update({
          AGM_CONFIRM_STAT: 'C',
          AGM_CONFIRM_OBS: `CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
          AGM_CONFIRM_USR: process.env.SERVER_API_USER
        })
      await Database.manager.close('mssql')
      //console.log("QUERY CONFIRMAÇÃO", query)
      return query

    } catch (error) {
      return error
    }
  }

  async confirmScheduleAll() {

    console.log("Executando confirmações no Smart...")
    const dateNow = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
    const startOfDay = await DateFormat("yyyy-MM-dd 00:00", DateTime.local())
    const endOfDay = await DateFormat("yyyy-MM-dd 23:59", DateTime.local())
    const returnChats = await Chat.query()
      .preload('shippingcampaign')
      .whereBetween('created_at', [startOfDay, endOfDay])
      .andWhere('externalstatus', 'A')
      .andWhere('absoluteresp', 1)
      .andWhere('interaction_id', 1)

    try {
      for (const chat of returnChats) {
        const momentDate = moment(chat.shippingcampaign.dateshedule)
        const dateStart = momentDate.format('YYYY-MM-DD 00:00:00')
        const dateEnd = momentDate.format('YYYY-MM-DD 23:59:00')
        const query = await Database.connection('mssql')
          .from('agm')
          .where('agm_pac', chat.reg)
          .andWhereBetween('agm_hini', [dateStart, dateEnd])
          .whereNotIn('agm_stat', ['C', 'B'])
          .whereNotIn('agm_confirm_stat', ['C'])
          .update({
            AGM_CONFIRM_STAT: 'C',
            AGM_CONFIRM_OBS: `DIGI3: CONFIRMA ou CANCELA - WhatsApp em ${dateNow}`,
            AGM_CONFIRM_USR: process.env.SERVER_API_USER
          })

        if (query > 0) {
          await Chat.query().where('reg', chat.reg).andWhere('idexternal', chat.idexternal).update({ externalstatus: 'B' })
        }

      }
    } catch (error) {
      return error
    }
  }


  // async cancelScheduleAll1() {

  //   console.log("Executando Cancelamentos no Smart...")
  //   const dateNow = await DateFormat("dd/MM/yyyy HH:mm:ss", DateTime.local())
  //   const startOfDay = await DateFormat("yyyy-MM-dd 00:00", DateTime.local())
  //   const endOfDay = await DateFormat("yyyy-MM-dd 23:59", DateTime.local())
  //   const returnChats = await Chat.query()
  //     .preload('shippingcampaign')
  //     .whereBetween('created_at', [startOfDay, endOfDay])
  //     .andWhere('externalstatus', 'A')
  //     .andWhere('absoluteresp', 2)
  //     .andWhere('interaction_id', 1)
  //   try {
  //     for (const chat of returnChats) {
  //       const momentDate = moment(chat.shippingcampaign.dateshedule)
  //       const dateStart = momentDate.format('YYYY-MM-DD 00:00:00')
  //       const dateEnd = momentDate.format('YYYY-MM-DD 23:59:00')
  //       const query = await Database.connection('mssql')
  //         .from('agm')
  //         .where('agm_pac', chat.reg)
  //         .andWhereBetween('agm_hini', [dateStart, dateEnd])
  //         .whereNotIn('agm_stat', ['C', 'B'])
  //         .whereNotIn('agm_confirm_stat', ['C'])
  //         .update({
  //           AGM_CONFIRM_STAT: 'N',
  //           AGM_CONFIRM_OBS: chat.invalidresponse + ` (Desmarcado por NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${dateNow})`,
  //           AGM_CONFIRM_USR: 'NEOCONFIRM',
  //           AGM_CONFIRM_MOC: 'IRI'
  //         })

  //       if (query > 0) {
  //         console.log("cancelamento realizado sucesso")
  //         await Chat.query().where('reg', chat.reg).andWhere('idexternal', chat.idexternal).update({ externalstatus: 'B' })
  //       }

  //       //await Database.manager.close('mssql')

  //       //return query

  //     }
  //   } catch (error) {
  //     return error
  //   }
  // }

  async cancelScheduleAll() {
    console.log("Executando Cancelamentos no Smart...")
    const startOfDay = await DateFormat("yyyy-MM-dd 00:00", DateTime.local())
    const endOfDay = await DateFormat("yyyy-MM-dd 23:59", DateTime.local())
    const returnChats = await Chat.query()
      .preload('shippingcampaign')
      .whereBetween('created_at', [startOfDay, endOfDay])
      .andWhere('externalstatus', 'A')
      .andWhere('absoluteresp', 2)
      .andWhere('interaction_id', 1)

    try {
      for (const chat of returnChats) {
        const momentDate = moment(chat.shippingcampaign.dateshedule)
        const dateStart = momentDate.format('YYYY-MM-DD 00:00:00')
        const dateEnd = momentDate.format('YYYY-MM-DD 23:59:00')
        const query = await Database.connection('mssql')
          .from('agm')
          .where('agm_pac', chat.reg)
          .andWhereBetween('agm_hini', [dateStart, dateEnd])
          .whereNotIn('agm_stat', ['C', 'B'])
          .whereNotIn('agm_confirm_stat', ['C'])
        for (const agm of query) {
          const body = {
            "PacienteId": agm.AGM_PAC,
            "ProcedimentoId": agm.AGM_SMK,
            "ProfissionalExecutanteId": agm.AGM_MED,
            "DataHora": DateTime.fromJSDate(agm.AGM_HINI, { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm')
          }
          const response = await cancelSchedule(body)
          if (response?.status == 200) {
            console.log(`Cancelamento PacReg:${agm.AGM_PAC}, Procedimento:${agm.AGM_SMK} Data:${DateTime.fromJSDate(agm.AGM_HINI, { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm')}`)
            await Chat.query().where('reg', chat.reg).andWhere('idexternal', chat.idexternal).update({ externalstatus: 'B' })
          }
        }
      }
    } catch (error) {
      return error
    }
  }

  async serviceEvaluation() {
    async function greeting(message: String) {
      //const greeting = ['Olá!😀', 'Oi tudo bem?😀', 'Saudações!😀', 'Oi como vai?😀']
      const responseList = new ResponsesController()
      const greeting = await responseList.index({ local: 'greeting' })

      const question = ['em uma escala de *0 a 10*, o quanto você indicaria o nosso Núcleo de Excelência em Oftalmologia a um amigo ou parente?',
        'em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou membro da família?',
        'em uma escala de *0 a 10*, o quanto você indicaria o Núcleo de Excelência em Oftalmologia a alguém que você conhece?',
        'em uma escala de *0 a 10*, o quanto você recomendaria o Núcleo de Excelência em Oftalmologia para um amigo ou familiar?',
      ]
      return message.replace('{greeting}', greeting).replace('{question}', question[Math.floor(Math.random() * question.length)])
    }
    const pacQueryModel = await Interaction.find(2)

    const env = process.env.NODE_ENV
    let pacQuery

    if (env === 'development')
      pacQuery = pacQueryModel?.querydev
    else pacQuery = pacQueryModel?.query

    try {
      const result = await Database.connection('mssql').rawQuery(pacQuery)
      for (const data of result) {
        const message = await greeting(data.message)
        data.message = message
      }
      //console.log("RESULTADO", result)
      await Database.manager.close('mssql')
      return result
    } catch (error) {
      return { "ERRO": "ERRO 21221", error }
    }

  }


  async resetCellphone() {
    const date_start = DateTime.now().startOf('day').toFormat("yyyy-MM-dd HH:mm");
    const date_end = DateTime.now().endOf('day').toFormat("yyyy-MM-dd HH:mm");

    try {
      await Shippingcampaign.query()
        .where('phonevalid', 0)
        .whereBetween('created_at', [date_start, date_end])
        .update({ phonevalid: null })
    } catch (error) {
      return { "ERRO": "ERRO 21221", error }
    }


  }



}
