import Mail from '@ioc:Adonis/Addons/Mail'
import BadRequest from 'App/Exceptions/BadRequestException'
import Manifest from 'App/Models/Manifest'
import { DateTime } from 'luxon'

export async function sendMailManifest(bodyManifest: Manifest, report: string = "") {
  try {
    const body = {
      id: bodyManifest.id || 'ID não disponível',
      chat_id: bodyManifest.chat_id || 'Chat ID não disponível',
      reg: bodyManifest.chat?.reg || 'Registro não disponível',
      name_pac: bodyManifest.chat?.name || 'Nome do paciente não disponível',
      cellphone: bodyManifest.chat?.cellphone || 'Celular não disponível',
      mainsubject: bodyManifest.mainsubject?.description || 'Assunto não disponível',
      user_resposible: bodyManifest.user?.name || 'Gestor não disponível',
      report: report.replace(/\r?\n/g, '<br>') || 'Relato não disponível',
      employee_involved: bodyManifest.employee_involved || 'Recepcionista não disponível',
      medic_einvolved: bodyManifest.medic_einvolved || 'Médico não disponível',
      date_limit: bodyManifest.date_limit
        ? DateTime.fromISO(bodyManifest.date_limit).toFormat("dd/MM/yyyy")
        : 'Data limite não disponível',
      root_cause: bodyManifest.root_cause || 'Causa raiz não disponível',
      action: bodyManifest.action || 'Ação não disponível',
      obs: bodyManifest.obs || 'Observação não disponível'
    };

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
