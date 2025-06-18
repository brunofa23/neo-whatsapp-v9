
import { test } from '@japa/runner'
import DatasourcesController from 'App/Controllers/Http/DatasourcesController'
import { DateTime } from 'luxon'
import PersistShippingcampaign from "App/Services/whatsapp-web/PersistShippingcampaign"
import Config from 'App/Models/Config'
test('display welcome page', async ({ client }) => {

  const configId = 'scheduledPatients'
  const verifySchedulePatientsInConfigsDB = await Config.find(configId)
  if (!verifySchedulePatientsInConfigsDB) {
    console.log("Não está cadastrado. Criando registro...")
    await Config.updateOrCreate(
      { id: configId },
      {
        id: configId,
        name: 'Verifica se está rodando a função SchedulePatients',
        valuebool: true
      }
    )
  } else if (verifySchedulePatientsInConfigsDB.valuebool == false) {
    console.log("Existe, mas está falso. Atualizando para true...")
    verifySchedulePatientsInConfigsDB.valuebool = true
    await verifySchedulePatientsInConfigsDB.save()
  } else {
    console.log("Existe e está true. Nada a fazer.")
  }


  //console.log(">>", verifySchedulePatientsInConfigsDB)

}
)
