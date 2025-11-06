
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import Database from '@ioc:Adonis/Lucid/Database'
import Chat from 'App/Models/Chat'
import Shippingcampaign from 'App/Models/Shippingcampaign'
import { interpretAnswer } from 'App/Services/whatsapp-web/IdentifyAnswer'
import { responderPergunta } from 'App/Services/Ai/aiResponder'
import Interaction from 'App/Models/Interaction'
import ResponsesController from 'App/Controllers/Http/ResponsesController'

test('display welcome page', async ({ client }) => {

  // async function scheduledPatients(dateStr: string, unit_cod: number = 0): Promise<any[]> {
  //   //verifica se existe na tabela config a variável scheduledPatients para controlar a busca dos pacientes
  //   // Aguardar até que esteja liberado para rodar

  //   const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'America/Sao_Paulo' });
  //   if (!date.isValid) {
  //     throw new Error('Formato de data inválido. Use yyyy-MM-dd');
  //   }

  //   const dateStart = date.startOf('day').toFormat('yyyy-MM-dd HH:mm');
  //   const dateEnd = date.endOf('day').toFormat('yyyy-MM-dd HH:mm');

  //   // Função auxiliar para mensagens
  //   const greeting = async (message: string): Promise<string> => {
  //     const responseList = new ResponsesController();
  //     const greetings = await responseList.index({ local: 'greeting' });
  //     const presentations = await responseList.index({ local: 'presentation' });
  //     return message
  //       .replace('{greeting}', greetings)
  //       .replace('{presentation}', presentations);
  //   };

  //   const pacQueryModel = await Interaction.query().where('id', 3).first();
  //   if (!pacQueryModel) throw new Error('Consulta para scheduledPatients não encontrada');

  //   const env = process.env.NODE_ENV;
  //   const pacQuery = env === 'development' ? pacQueryModel.querydev : pacQueryModel.query;
  //   if (!pacQuery) throw new Error('Query inválida para scheduledPatients');

  //   let query = pacQuery
  //     .replace(/\{dateStart\}/g, dateStart)
  //     .replace(/\{dateEnd\}/g, dateEnd);

  //   if (unit_cod > 0) {
  //     query = query.replace('1=1', `emp_cod=${unit_cod}`);
  //   }

  //   try {
  //     const result = await Database.connection('mssql').rawQuery(query);
  //     for (const data of result) {
  //       if (data.message && typeof data.message === 'string') {
  //         data.message = await greeting(data.message);
  //       }
  //     }
  //     return result || [];

  //   } catch (error) {
  //     console.error('Erro em scheduledPatients:', error);
  //     return []
  //   }
  // }


  async function scheduledPatients(dateStr: string, unit_cod: number = 0): Promise<any[]> {
    // Valida e prepara datas
    const date = DateTime.fromFormat(dateStr, 'yyyy-MM-dd', { zone: 'America/Sao_Paulo' });
    if (!date.isValid) {
      throw new Error('Formato de data inválido. Use yyyy-MM-dd');
    }

    const dateStart = date.startOf('day').toFormat('yyyy-MM-dd HH:mm');
    const dateEnd = date.endOf('day').toFormat('yyyy-MM-dd HH:mm');

    // Função auxiliar para tratar mensagens
    const greeting = async (message: string): Promise<string> => {
      const responseList = new ResponsesController();
      const greetings = await responseList.index({ local: 'greeting' });
      const presentations = await responseList.index({ local: 'presentation' });
      return message
        .replace('{greeting}', greetings)
        .replace('{presentation}', presentations);
    };

    // Busca as queries de interação
    const pacQueryModels = await Interaction.query().where('id', 3);
    if (!pacQueryModels || pacQueryModels.length === 0) {
      throw new Error('Consulta para scheduledPatients não encontrada');
    }

    const env = process.env.NODE_ENV;
    const allResults: any[] = [];

    for (const pacQueryModel of pacQueryModels) {
      const pacQuery = env === 'development' ? pacQueryModel.querydev : pacQueryModel.query;
      if (!pacQuery) continue;

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
        allResults.push(...result);
      } catch (error) {
        console.error('Erro ao executar query de scheduledPatients:', error);
        continue; // continua mesmo se essa falhar
      }
    }

    return allResults;
  }


  const retorno = await scheduledPatients('2025-11-01')
  console.log(">>>>>>>>", retorno)



})
