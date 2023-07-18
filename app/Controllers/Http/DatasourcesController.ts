// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'

import moment = require('moment');

export default class DatasourcesController {

  async scheduledPatients() {

    const today = moment()
    let dataNow = moment()
    if (dataNow.day() === 6) {
      dataNow = dataNow.add(2, 'days')
    } else if (dataNow.day() === 0) {
      dataNow = dataNow.add(1, 'days')
    }
    const dataEnd = dataNow.add(2, 'days')

    const pacQuery = `select distinct(pac_reg)pac_reg,pac_nome,'3185228619' pac_celular,pac_ind_whatsapp,
    CONCAT(
      RIGHT('0' + CAST(DAY(AGM_HINI) AS VARCHAR(2)), 2), '/',
      RIGHT('0' + CAST(MONTH(AGM_HINI) AS VARCHAR(2)), 2), '/',
      CAST(YEAR(AGM_HINI) AS VARCHAR(4))
   ) AS data_agm
   from pac inner join agm on(agm_pac = PAC_REG)
   inner join psv on (agm_med=PSV_COD)
   where  AGM_HINI between '${today.format('YYYY-MM-DD')}'
   and '${dataEnd.format('YYYY-MM-DD')}'
   and AGM_STAT not in ('C')
   group by pac_nome, agm_hini, pac_reg, pac_ind_whatsapp, pac_celular`

    try {
      const result = await Database.connection('mssql').rawQuery(pacQuery)
      //console.log("QUERY", result)
      return result
    } catch (error) {
      return error
    }
  }


}
