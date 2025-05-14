import Mail from '@ioc:Adonis/Addons/Mail'
import BadRequest from 'App/Exceptions/BadRequestException'
import Manifest from 'App/Models/Manifest'

export async function sendMailManifest(bodyManifest: Manifest) {

  console.log(">>>>>>", bodyManifest?.mainsubject)

  try {

    const body = {
      id: bodyManifest.id,
      chat_id: bodyManifest.chat_id,
      reg: bodyManifest.chat.reg,
      name_pac: bodyManifest?.chat.name,
      cellphone: bodyManifest?.chat.cellphone,
      mainsubject: bodyManifest?.mainsubject.description,
      user_resposible: bodyManifest?.user.name,
      report: bodyManifest.report,
      employee_involved: bodyManifest.employee_involved,
      medic_einvolved: bodyManifest.medic_einvolved,
      date_limit: bodyManifest.date_limit,
      root_cause: bodyManifest.root_cause,
      action: bodyManifest.action,
      obs: bodyManifest.obs
    }

    console.log("$$$$$$$$$$", body)

    const send = await Mail.use('smtp').send((message) => {
      message
        .from(process.env.SMTP_USERNAME!)
        .subject('Registro de Manifesto - Easytalk')
      // TO + Template
      message.to(bodyManifest.user.email)
      message.htmlView('emails/manifest', body)
    })

    console.log("email enviado!!!!!!!!!!!!!")
    return send
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw new BadRequest('Erro ao enviar e-mail', 500, error)
  }
}
