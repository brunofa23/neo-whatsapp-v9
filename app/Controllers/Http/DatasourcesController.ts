// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

import moment = require('moment');

export default class DatasourcesController {

  async scheduledPatients() {


    const pacQuery = `SELECT
    1 AS interaction_id,
    1 AS interaction_seq,
    pac_reg AS reg,
    pac_nome AS name,
    pac_celular AS cellphone,
    pac_ind_whatsapp,
    agm_hini,
    agm_confirm_stat,
    PSV_APEL,
    SMK_ROT,
    CONCAT(
        RIGHT('0' + CAST(DAY(AGM_HINI) AS VARCHAR(2)), 2), '/',
        RIGHT('0' + CAST(MONTH(AGM_HINI) AS VARCHAR(2)), 2), '/',
        CAST(YEAR(AGM_HINI) AS VARCHAR(4))
    ) AS data_agm,
    agm_id AS idexternal,
    CONCAT(
        'Olá tudo bem? Eu sou a Iris, atendimento virtual do Neo, Núcleo de Excelência em Oftalmologia. O motivo do meu contato, ',
        CASE
            WHEN pac_sexo = 'M' THEN 'Sr. '
            WHEN pac_sexo = 'F' THEN 'Sra. '
            ELSE ''
        END,
        SUBSTRING(pac_nome, 1, CHARINDEX(' ', pac_nome) - 1),
        ', é para confirmar seu horário conosco, agendado para o dia ',
        FORMAT(CONVERT(datetime, agm_hini), 'dd/MM/yyyy HH:mm'),
        ' na Unidade ' + RTRIM(str_nome),
        ' com o Dr(a).',
        SUBSTRING(PSV_APEL, 1, CHARINDEX(' ', PSV_APEL) - 1),
        ' podemos confirmar?\n1 para sim \n2 para reagendamento'
    ) AS message
FROM (
    SELECT
        pac_reg, pac_nome, pac_celular, pac_ind_whatsapp, agm_hini, agm_id, agm_confirm_stat, str_nome, PSV_APEL, SMK_ROT, pac_sexo,
        ROW_NUMBER() OVER (PARTITION BY pac_nome ORDER BY agm_hini) AS row_num
    FROM pac
    INNER JOIN agm ON (agm_pac = PAC_REG)
    INNER JOIN psv ON (agm_med = PSV_COD)
    INNER JOIN STR ON (AGM_STR_COD = str_cod)
    INNER JOIN MED ON (AGM_MED = PSV_COD)
    INNER JOIN SMK ON (AGM_SMK = SMK_COD)
    WHERE
        agm_id IS NOT NULL
        AND PSV_CC <> 99999
        AND AGM_HINI BETWEEN
            CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
            AND CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
        AND AGM_STAT NOT IN ('C', 'B')
) AS subquery
WHERE row_num = 1
AND pac_reg in (23202, 252143)
ORDER BY AGM_HINI;`

    try {
      const result = await Database.connection('mssql').rawQuery(pacQuery)
      //console.log("QUERY", result)
      return result
    } catch (error) {
      return error
    }
  }

  async confirmSchedule(id: number) {
    const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}` //`update agm set agm_confirm_stat = 'C' where agm_id=:id`
    try {
      console.log("EXECUTANDO UPDATE NO SMART...", query)
      const result = await Database.connection('mssql').rawQuery(query)
      console.log("QUERY>>>", result)

    } catch (error) {
      return error
    }

  }


}
