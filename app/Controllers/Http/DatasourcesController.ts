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
        'Olá tudo bem? Eu sou a Iris, atendimento virtual do *Neo, Núcleo de Excelência em Oftalmologia*. O motivo do meu contato, ',
        CASE
            WHEN pac_sexo = 'M' THEN 'Sr. '
            WHEN pac_sexo = 'F' THEN 'Sra. '
            ELSE ''
        END
		,'*',
        SUBSTRING(pac_nome, 1, CHARINDEX(' ', pac_nome) - 1)
		,'*',
        ', é para confirmar seu horário conosco, agendado para o dia '
		,'*',
        FORMAT(CONVERT(datetime, agm_hini), 'dd/MM/yyyy HH:mm')
		,'*',
        ' na Unidade '
		,'*',
		RTRIM(str_nome)
		,'*',
        ' com ', psv_trat
		,' *',
        SUBSTRING(PSV_APEL, 1, CHARINDEX(' ', PSV_APEL) - 1)
		,'*',
        ' podemos confirmar?\n*1* para sim \n*2* para reagendamento'
    ) AS message,
    concat('{"address":"',CONCAT(EMP_END,', ',emp_comp,', ',EMP_END_BAIRRO),'", "medic":"',psv_trat,' ',SUBSTRING(PSV_APEL, 1, CHARINDEX(' ', PSV_APEL) - 1),'"}') AS otherfields

FROM (
    SELECT
        pac_reg, pac_nome, pac_celular, pac_ind_whatsapp, agm_hini, agm_id, agm_confirm_stat, str_nome, PSV_APEL, SMK_ROT, pac_sexo,emp_end, emp_comp,EMP_END_BAIRRO,psv_trat,
        ROW_NUMBER() OVER (PARTITION BY pac_nome ORDER BY agm_hini) AS row_num
    FROM pac
    INNER JOIN agm ON (agm_pac = PAC_REG)
    INNER JOIN psv ON (agm_med = PSV_COD)
    INNER JOIN STR ON (AGM_STR_COD = str_cod)
    INNER JOIN MED ON (AGM_MED = PSV_COD)
    INNER JOIN SMK ON (AGM_SMK = SMK_COD)
	inner join emp on (STR_EMP_COD=emp_cod)
    WHERE
        agm_id IS NOT NULL
        AND PSV_CC <> 99999
		/*************************************/
		AND AGM_HINI BETWEEN
    CASE
        WHEN DATEPART(WEEKDAY, GETDATE()) = 5 -- Quinta-feira
            THEN CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
        WHEN DATEPART(WEEKDAY, GETDATE()) = 6 -- Sexta-feira
            THEN CAST(DATEADD(DAY, 4, GETDATE()) AS DATE)
        WHEN DATEPART(WEEKDAY, GETDATE()) > 1 AND DATEPART(WEEKDAY, GETDATE()) < 5 -- Outros dias da semana (segunda a quarta-feira)
            THEN CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
    END
AND
    CASE
        WHEN DATEPART(WEEKDAY, GETDATE()) = 5 -- Quinta-feira
            THEN CAST(DATEADD(DAY, 5, GETDATE()) AS DATE)
        WHEN DATEPART(WEEKDAY, GETDATE()) = 6 -- Sexta-feira
            THEN CAST(DATEADD(DAY, 5, GETDATE()) AS DATE)
        WHEN DATEPART(WEEKDAY, GETDATE()) > 1 AND DATEPART(WEEKDAY, GETDATE()) < 5-- Outros dias da semana (segunda a quarta-feira)
            THEN CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
    END
		/****************************************/
		AND AGM_STAT NOT IN ('C', 'B')
		AND AGM_CONFIRM_STAT NOT IN ('C')
) AS subquery
WHERE row_num = 1
AND pac_reg in (23202, 252143,343367)
ORDER BY AGM_HINI;`

    //cod dr Rodrigo:91102

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
      await Database.connection('mssql').rawQuery(query)

    } catch (error) {
      return error
    }

  }


}
