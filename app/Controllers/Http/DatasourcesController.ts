// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

export default class DatasourcesController {

  async scheduledPatients() {
    const pacQuery = `select distinct(pac_reg),pac_nome,'3185228619' pac_celular,pac_ind_whatsapp,AGM_MED,psv_nome,
    CONCAT(
      RIGHT('0' + CAST(DAY(AGM_HINI) AS VARCHAR(2)), 2), '/',
      RIGHT('0' + CAST(MONTH(AGM_HINI) AS VARCHAR(2)), 2), '/',
      CAST(YEAR(AGM_HINI) AS VARCHAR(4))
   ) AS data_agm
   from pac inner join agm on(agm_pac = PAC_REG)
   inner join psv on (agm_med=PSV_COD)
   where  AGM_HINI between '2023-07-14' and '2023-07-15' and AGM_STAT not in ('C')
   group by pac_nome, AGM_HINI, pac_reg, pac_ind_whatsapp, pac_celular, agm_med, PSV_NOME`

    try {
      const result = await Database.connection('mssql').rawQuery(pacQuery)
      return result
    } catch (error) {
      return error
    }
  }


}
