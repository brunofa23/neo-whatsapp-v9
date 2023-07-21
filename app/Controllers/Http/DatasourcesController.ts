// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

import moment = require('moment');

export default class DatasourcesController {

  async scheduledPatients() {

    //QUERY ORIGINAL
    // const pacQuery = `SELECT top 1 1 interaction, pac_reg, pac_nome, '31985228619' AS pac_celular, pac_ind_whatsapp, agm_hini,
    //     CONCAT(
    //       RIGHT('0' + CAST(DAY(AGM_HINI) AS VARCHAR(2)), 2), '/',
    //       RIGHT('0' + CAST(MONTH(AGM_HINI) AS VARCHAR(2)), 2), '/',
    //       CAST(YEAR(AGM_HINI) AS VARCHAR(4))
    //     ) AS data_agm, agm_id,
    //   CONCAT('Olá ',SUBSTRING(pac_nome, 1, CHARINDEX(' ', pac_nome) - 1), ' tudo bem? temos uma consulta agendada para o dia', FORMAT(CONVERT(datetime,agm_hini), 'dd/MM/yyyy HH:mm')+' gostaria de confirmar? 1-Sim 2-Não') as message
    //   FROM (
    // SELECT pac_reg, pac_nome, '3185228619' AS pac_celular, pac_ind_whatsapp, agm_hini,agm_id,
    //       ROW_NUMBER() OVER (PARTITION BY pac_nome ORDER BY agm_hini) AS row_num
    // FROM pac
    // INNER JOIN agm ON (agm_pac = PAC_REG)
    // INNER JOIN psv ON (agm_med = PSV_COD)
    // WHERE AGM_HINI BETWEEN CONVERT(DATETIME, CONVERT(DATE, GETDATE()))
    //    AND CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
    //    AND AGM_STAT NOT IN ('C')
    // ) AS subquery
    // WHERE row_num = 1`

    const pacQuery = `SELECT top 1 1 interaction, pac_reg, pac_nome, '31985228619' AS pac_celular, pac_ind_whatsapp, agm_hini,
    CONCAT(
      RIGHT('0' + CAST(DAY(AGM_HINI) AS VARCHAR(2)), 2), '/',
      RIGHT('0' + CAST(MONTH(AGM_HINI) AS VARCHAR(2)), 2), '/',
      CAST(YEAR(AGM_HINI) AS VARCHAR(4))
    ) AS data_agm, agm_id,
  CONCAT('Olá ',SUBSTRING(pac_nome, 1, CHARINDEX(' ', pac_nome) - 1), ' tudo bem? temos uma consulta agendada para o dia', FORMAT(CONVERT(datetime,agm_hini), 'dd/MM/yyyy HH:mm')+' gostaria de confirmar? 1-Sim 2-Não') as message
  FROM (
SELECT pac_reg, pac_nome, '3185228619' AS pac_celular, pac_ind_whatsapp, agm_hini,agm_id,
      ROW_NUMBER() OVER (PARTITION BY pac_nome ORDER BY agm_hini) AS row_num
FROM pac
INNER JOIN agm ON (agm_pac = PAC_REG)
INNER JOIN psv ON (agm_med = PSV_COD)
WHERE agm_id is not null and
AGM_HINI BETWEEN CONVERT(DATETIME, CONVERT(DATE, GETDATE()))
   AND CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
   AND AGM_STAT NOT IN ('C')
) AS subquery
WHERE row_num = 1`

    try {
      const result = await Database.connection('mssql').rawQuery(pacQuery)
      //console.log("QUERY", result)
      return result
    } catch (error) {
      return error
    }
  }

  async confirmSchedule(id: number) {
    const query = `update agm set agm_confirm_stat = 'C' where agm_id=:id`
    try {
      console.log("EXECUTANDO UPDATE NO SMART...")
      await Database.connection('mssql').rawQuery(query, { id: id })
    } catch (error) {
      return error
    }

  }


}
