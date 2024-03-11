import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Config from 'App/Models/Config'

const { exec } = require('child_process')
export default class ConfigsController {

  public async index({ response }: HttpContextContract) {

    //const dateStart = await DateFormat("yyyy-MM-dd 00:00:00", DateTime.local())
    //const dateEnd = await DateFormat("yyyy-MM-dd 23:59:00", DateTime.local())
    try {
      const data = await Config.query()
      return response.status(200).send(data)

    } catch (error) {
      return error
    }

  }


  public async show({ auth, params, response }: HttpContextContract) {
    //const authenticate = await auth.use('api').authenticate()
    const data = await Config.query().where('id', params.id).first()
    return response.status(200).send(data)
  }



  public async update({ params, request, response }: HttpContextContract) {
    const body = request.only(Config.fillable)
    //body.valuedatetime = DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
    try {
      const data = await Config.query().where('id', params.id)
        .update(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }


  public async restartSystem({ auth, response }: HttpContextContract) {

    //const authenticate = await auth.use('api').authenticate()
    console.log("Executando restart system....")
    try {
      exec('pm2 restart easytalk', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:\n${stdout}`);
        return response.status(200).send({ error, stderr, stdout })
      });



    } catch (error) {
      return error
    }
  }

}
