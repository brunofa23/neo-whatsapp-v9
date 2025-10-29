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
import Config from 'App/Models/Config';
export default class DatasourcesController {


  async DataSource(date: string, interaction_id: number = 0, unit_cod: number = 0): Promise<any[]> {
    try {
      let schedulePatientsArray: any[] = [];
      let serviceEvaluationArray: any[] = [];

      // Executa interações específicas diretamente
      if (interaction_id === 1) {
        return await this.scheduledPatients(date, unit_cod);
      }

      if (interaction_id === 2) {
        return await this.serviceEvaluation();
      }

      const interactionList = await Interaction.query().where('status', 1);

      for (const interaction of interactionList) {
        switch (interaction.id) {
          case 1:
            schedulePatientsArray = await this.scheduledPatients(date, unit_cod);
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


  public async scheduledPatients(dateStr: string, unit_cod: number = 0): Promise<any[]> {
    //verifica se existe na tabela config a variável scheduledPatients para controlar a busca dos pacientes
    // Aguardar até que esteja liberado para rodar

    const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'America/Sao_Paulo' });
    if (!date.isValid) {
      throw new Error('Formato de data inválido. Use yyyy-MM-dd');
    }

    const dateStart = date.startOf('day').toFormat('yyyy-MM-dd HH:mm');
    const dateEnd = date.endOf('day').toFormat('yyyy-MM-dd HH:mm');

    // Função auxiliar para mensagens
    const greeting = async (message: string): Promise<string> => {
      const responseList = new ResponsesController();
      const greetings = await responseList.index({ local: 'greeting' });
      const presentations = await responseList.index({ local: 'presentation' });
      return message
        .replace('{greeting}', greetings)
        .replace('{presentation}', presentations);
    };

    const pacQueryModel = await Interaction.query().where('id', 1).first();
    if (!pacQueryModel) throw new Error('Consulta para scheduledPatients não encontrada');

    const env = process.env.NODE_ENV;
    const pacQuery = env === 'development' ? pacQueryModel.querydev : pacQueryModel.query;
    if (!pacQuery) throw new Error('Query inválida para scheduledPatients');

    let query = pacQuery
      .replace(/\{dateStart\}/g, dateStart)
      .replace(/\{dateEnd\}/g, dateEnd);

    if (unit_cod > 0) {
      query = query.replace('1=1', `emp_cod=${unit_cod}`);
    }

    try {
      const result = await Database.connection('mssql').rawQuery(query);
      for (const data of result) {
        if (data.message && typeof data.message === 'string') {
          data.message = await greeting(data.message);
        }
      }
      return result || [];

    } catch (error) {
      console.error('Erro em scheduledPatients:', error);
      return []
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
      return result || []
    } catch (error) {
      console.error('Erro na serviceEvaluation:', error)
      return [] // <- retorna array vazio, não objeto
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


  //ENDPOIT TO OSM TABLE + PAC + SMM TO RANGE DATE
  public async patientsByProcedures({ auth, request, response }) {
  await auth.use('api').authenticate()
  const startDate = request.input('start_date') // ex: 2025-10-11
  const endDate = request.input('end_date')     // ex: 2025-10-12

  const query = Database.connection('mssql')
    .from('OSM')
    .innerJoin('SMM', function () {
      this.on('OSM.OSM_SERIE', '=', 'SMM.SMM_OSM_SERIE')
      this.on('OSM.OSM_NUM', '=', 'SMM.SMM_OSM')
    })
    .innerJoin('PAC', 'PAC.PAC_REG', 'OSM.OSM_PAC')
    .innerJoin('CNV', 'OSM.OSM_CNV', 'CNV.CNV_COD')
    .whereBetween('OSM.OSM_DTHR', [startDate, endDate])
    .select(
      // OSM (sem alias)
      'OSM.OSM_SERIE',
      'OSM.OSM_NUM',
      'OSM.OSM_PAC',
      'OSM.OSM_DTHR',
      'OSM.OSM_CNV',
      'CNV.CNV_NOME',
      'OSM.OSM_PROC',
      'OSM.OSM_MREQ',
      'OSM.OSM_STR',
      'OSM.OSM_STATUS',
      'OSM.OSM_IND_URG',
      'OSM.OSM_HSP_NUM',
      'OSM.OSM_TIPO',
      'OSM.OSM_DT_RESULT',
      'OSM.OSM_ATEND',
      'OSM.OSM_CID_COD',
      'OSM.OSM_OBS',
      'OSM.OSM_MCNV',
      'OSM.OSM_PADRAO_PRECO',
      'OSM.OSM_DT_SOLIC',
      'OSM.OSM_HORA_ESP',
      'OSM.OSM_LIB_PAG',
      'OSM.OSM_LIB_PAG_DTHR',
      'OSM.OSM_LIB_PAG_USR',
      'OSM.OSM_MTE_SERIE_BENEF',
      'OSM.OSM_MTE_SEQ_BENEF',
      'OSM.OSM_OSM_SERIE_BENEF',
      'OSM.OSM_OSM_NUM_BENEF',
      'OSM.OSM_LIB_PAG_SERIE',
      'OSM.OSM_LIB_PAG_NUM',
      'OSM.OSM_ASO_MES_REF',
      'OSM.OSM_NUM_EXTERNO',
      'OSM.OSM_CML_CNV_COD',

      // PAC (sem alias)
      'PAC.PAC_REG',
      'PAC.PAC_DREG',
      'PAC.PAC_PRONT',
      'PAC.PAC_NOME',
      'PAC.pac_nome_social',
      'PAC.pac_flag_social',
      'PAC.pac_dthr_social',
      'PAC.PAC_SEXO',
      'PAC.PAC_NASC',
      'PAC.PAC_EST_CIVIL',
      'PAC.PAC_NOME_MAE',
      'PAC.PAC_NUMCPF',
      'PAC.PAC_NUMRG',
      'PAC.PAC_NUMRG_ORG',
      'PAC.PAC_NUMRG_UF',
      'PAC.PAC_NUMRG_DTEXP',
      'PAC.PAC_EMAIL',
      'PAC.PAC_FONE',
      'PAC.PAC_FONE2',
      'PAC.PAC_CELULAR',
      'PAC.PAC_RAMAL',
      'PAC.pac_ind_whatsapp',
      'PAC.PAC_END',
      'PAC.PAC_END_NUM',
      'PAC.PAC_COMP',
      'PAC.PAC_COMP_EXTRA',
      'PAC.PAC_CEP',
      'PAC.PAC_CID',
      'PAC.PAC_UF',
      'PAC.PAC_ZONA',
      'PAC.PAC_LGR_COD',
      'PAC.PAC_CARTAO_SUS',
      'PAC.PAC_SUS_SISCEL',
      'PAC.PAC_CNV',
      'PAC.PAC_MCNV',
      'PAC.PAC_CNV_COD',
      'PAC.PAC_PLN_COD',
      'PAC.PAC_COD_DEPCNV',
      'PAC.PAC_DTCNV_PAG',
      'PAC.PAC_DTCNV_VAL',
      'PAC.PAC_CNV2',
      'PAC.PAC_MCNV2',
      'PAC.PAC_CNV2_COD',
      'PAC.PAC_PLN2_COD',
      'PAC.PAC_COD_DEPCNV2',
      'PAC.PAC_PESO',
      'PAC.pac_peso_unid',
      'PAC.PAC_ALT',
      'PAC.pac_alt_unid',
      'PAC.PAC_ABORH',

      // SMM (sem alias)
      'SMM.SMM_OSM_SERIE',
      'SMM.SMM_OSM',
      'SMM.SMM_NUM',
      'SMM.SMM_TPCOD',
      'SMM.SMM_COD',
      'SMM.SMM_QT',
      'SMM.SMM_EXEC',
      'SMM.SMM_SFAT',
      'SMM.SMM_FAT_SERIE',
      'SMM.SMM_FAT',
      'SMM.SMM_REP',
      'SMM.SMM_STR',
      'SMM.SMM_MED',
      'SMM.SMM_VLR',
      'SMM.SMM_DTHR_EXEC',
      'SMM.SMM_PAC_REG',
      'SMM.SMM_CNV_COD'
    )
    .orderBy('OSM.OSM_SERIE')
    .orderBy('OSM.OSM_NUM')
    .orderBy('OSM.OSM_PAC')
    .orderBy('SMM.SMM_NUM')

  console.log(query.toQuery())
  const rows = await query

  // 🔹 Agrupa por (OSM_SERIE|OSM_NUM|OSM_PAC), aninhando 1x pac e todas as smm
  const groups = new Map<string, any>()

  for (const row of rows) {
    const pac: any = {}
    const smm: any = {}
    const osm: any = {}

    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith('PAC_') || key.startsWith('pac_')) {
        pac[key] = value
      } else if (key.startsWith('SMM_')) {
        smm[key] = value
      } else {
        osm[key] = value // inclui OSM_SERIE, OSM_NUM, OSM_PAC e demais campos da OSM
      }
    }

    const serie = osm.OSM_SERIE
    const num = osm.OSM_NUM
    const pacReg = osm.OSM_PAC
    const gkey = `${serie}|${num}|${pacReg}`

    if (!groups.has(gkey)) {
      groups.set(gkey, { ...osm, pac, smms: [] as any[] })
    }

    // (Opcional: dedupe por SMM_NUM se houver risco de duplicata)
    // const bucket = groups.get(gkey)
    // bucket._seen ??= new Set<string>()
    // const smmKey = `${smm.SMM_OSM_SERIE}|${smm.SMM_OSM}|${smm.SMM_NUM}`
    // if (!bucket._seen.has(smmKey)) {
    //   bucket._seen.add(smmKey)
    //   bucket.smms.push(smm)
    // }

    groups.get(gkey).smms.push(smm)
  }

  const result = Array.from(groups.values()).map(item => {
    // limpa marcador interno se tiver usado dedupe
    if (item._seen) delete item._seen
    return item
  })

  return response.send(result)
}



  public async patientsBySchedules({ auth, request, response }) {
    await auth.use('api').authenticate()

    const startDate = request.input('start_date') // ex: 2025-10-11
    const endDate = request.input('end_date')     // ex: 2025-10-12

    const query = Database.connection('mssql')
      .from('AGM')
      .innerJoin('PAC', 'PAC.PAC_REG', 'AGM.AGM_PAC')
      .select(
        // 👉 Campos de AGM
        'AGM.AGM_MED',
        'AGM.AGM_LOC',
        'AGM.AGM_HINI',
        'AGM.AGM_HFIM',
        'AGM.AGM_PAC',
        'AGM.AGM_TPSMK',
        'AGM.agm_smk',
        'AGM.AGM_REC',
        'AGM.AGM_STAT',
        'AGM.AGM_CTF',
        'AGM.AGM_DTMRC',
        'AGM.AGM_ATEND',
        'AGM.AGM_STR_COD',
        'AGM.AGM_CONFIRM_STAT',
        'AGM.AGM_CONFIRM_USR',
        'AGM.AGM_CONFIRM_DTHR',
        'AGM.AGM_CNV_COD',

        // 👉 Campos da PAC (iguais aos já usados)
        'PAC.PAC_REG',
        'PAC.PAC_DREG',
        'PAC.PAC_PRONT',
        'PAC.PAC_NOME',
        'PAC.pac_nome_social',
        'PAC.pac_flag_social',
        'PAC.pac_dthr_social',
        'PAC.PAC_SEXO',
        'PAC.PAC_NASC',
        'PAC.PAC_EST_CIVIL',
        'PAC.PAC_NOME_MAE',
        'PAC.PAC_NUMCPF',
        'PAC.PAC_NUMRG',
        'PAC.PAC_NUMRG_ORG',
        'PAC.PAC_NUMRG_UF',
        'PAC.PAC_NUMRG_DTEXP',
        'PAC.PAC_EMAIL',
        'PAC.PAC_FONE',
        'PAC.PAC_FONE2',
        'PAC.PAC_CELULAR',
        'PAC.PAC_RAMAL',
        'PAC.pac_ind_whatsapp',
        'PAC.PAC_END',
        'PAC.PAC_END_NUM',
        'PAC.PAC_COMP',
        'PAC.PAC_COMP_EXTRA',
        'PAC.PAC_CEP',
        'PAC.PAC_CID',
        'PAC.PAC_UF',
        'PAC.PAC_ZONA',
        'PAC.PAC_LGR_COD',
        'PAC.PAC_CARTAO_SUS',
        'PAC.PAC_SUS_SISCEL',
        'PAC.PAC_CNV',
        'PAC.PAC_MCNV',
        'PAC.PAC_CNV_COD',
        'PAC.PAC_PLN_COD',
        'PAC.PAC_COD_DEPCNV',
        'PAC.PAC_DTCNV_PAG',
        'PAC.PAC_DTCNV_VAL',
        'PAC.PAC_CNV2',
        'PAC.PAC_MCNV2',
        'PAC.PAC_CNV2_COD',
        'PAC.PAC_PLN2_COD',
        'PAC.PAC_COD_DEPCNV2',
        'PAC.PAC_PESO',
        'PAC.pac_peso_unid',
        'PAC.PAC_ALT',
        'PAC.pac_alt_unid',
        'PAC.PAC_ABORH'
      )

    // 🔹 Filtro dinâmico de período
    if (startDate && endDate) {
      query.whereBetween('AGM.AGM_HINI', [
        `${startDate} 00:00:00`,
        `${endDate} 23:59:59`,
      ])
    } else if (startDate) {
      query.where('AGM.AGM_HINI', '>=', `${startDate} 00:00:00`)
    } else if (endDate) {
      query.where('AGM.AGM_HINI', '<=', `${endDate} 23:59:59`)
    }

    const rows = await query.orderBy('AGM.AGM_HINI', 'asc')

    // 🔹 Monta o retorno: { agm: { ... }, pac: { ... } }
    const result = rows.map((row) => {
      const agm: any = {}
      const pac: any = {}

      for (const [key, value] of Object.entries(row)) {
        if (key.startsWith('PAC_') || key.startsWith('pac_')) pac[key] = value
        else agm[key] = value
      }

      return { agm: { ...agm, pac } }
    })

    return response.send(result)
  }





}
