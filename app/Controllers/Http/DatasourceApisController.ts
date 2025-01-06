import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { getPatients } from 'App/Services/requestExternal/request'
export default class DatasourceApisController {

  //BUSCAR OS PACIENTES DE AGENDAMENTO NO KLINGO
    public async getPatients({auth, response }: HttpContextContract) {
      //await auth.use('api').authenticate()
      try {
        //chmamar a API DO KLINGO
        const response = await getPatients()
        console.log("GET PATIENTS..", response)
        return response

        // const data = await Chat.query()
        //return response.status(200).send(data)
      } catch (error) {
        return error
      }
    }



  //BUSCAR OS PACIENTES ATENDIDOS NO KLINGO




}
