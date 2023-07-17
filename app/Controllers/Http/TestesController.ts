import { typeServerConfig } from '@ioc:Adonis/Core/Server';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Shippingcampaign from 'App/Models/Shippingcampaign'


async function scheduledPatients() {

  //return "testando schedulePatients"
  const pacQuery = `select distinct(pac_reg),pac_nome,
    CONCAT(
      RIGHT('0' + CAST(DAY(AGM_HINI) AS VARCHAR(2)), 2), '/',
      RIGHT('0' + CAST(MONTH(AGM_HINI) AS VARCHAR(2)), 2), '/',
      CAST(YEAR(AGM_HINI) AS VARCHAR(4))
   ) AS data_formatada
   from pac inner join agm on(agm_pac = PAC_REG)
   where  AGM_HINI between '2023-07-14' and '2023-07-15' and AGM_STAT not in ('C')
   group by pac_nome, AGM_HINI, pac_reg`

  try {
    const result = await Database.connection('mssql').rawQuery(pacQuery,
      {
        PAC_REG: 63343,
        AGM_HINI_INI: '2023-07-14', AGM_HINI_FIM: '2023-07-15'
      })
    return result
  } catch (error) {
    return error
  }
}


async function Shipping() {

  const pacQuery = "select * from teste"
  const result = await Database.connection('mssql2').rawQuery(pacQuery)
  return result
  // const shipping = await Shippingcampaign.all()
  // console.log("shipping", shipping)
  // return shipping
}

module.exports = { scheduledPatients, Shipping }





