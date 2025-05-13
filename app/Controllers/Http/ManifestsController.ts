import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Manifest from 'App/Models/Manifest'
import { sendMailManifest } from 'App/Services/mail/sendMail'
export default class ManifestsController {

  public async index({ auth, response }: HttpContextContract) {

  }

  public async show({ auth, params, response }: HttpContextContract) {
    //await auth.use('api').authenticate()
    try {
      const data = await Manifest.query().where('chat_id', params.id)
      return response.status(200).send(data)
    } catch (error) {
      return error
    }
  }


  public async store({ auth, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Manifest.fillable)
    try {
      const data = await Manifest.create(body)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }

  public async update({ auth, params, request, response }: HttpContextContract) {
    await auth.use('api').authenticate()
    const body = request.only(Manifest.fillable)
    try {
      const data = await Manifest.query().where('id', params.id)
        .update(body)

      const sendmail = await sendMailManifest()
      console.log("@@@@@", sendmail)
      return response.status(201).send(data)
    } catch (error) {
      return error
    }
  }


}
