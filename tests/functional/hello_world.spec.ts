
import { test } from '@japa/runner'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import { DateTime } from 'luxon'
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"

test('display welcome page', async ({ client }) => {

  let date = DateTime.local().setZone('America/Sao_Paulo').plus({ days: 2 });

  console.log("DATE::", date)

  // const weekday = date.weekday; // Luxon: 1 = segunda, ..., 7 = domingo
  //   if (weekday === 6) {
  //     // sábado → próxima segunda
  //     date = date.plus({ days: 2 });
  //   } else if (weekday === 7) {
  //     // domingo → próxima terça
  //     date = date.plus({ days: 2 });
  //   }

}
)
