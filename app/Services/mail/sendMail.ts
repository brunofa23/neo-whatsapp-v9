import Mail from '@ioc:Adonis/Addons/Mail'
import BadRequest from 'App/Exceptions/BadRequestException'

export async function sendMailManifest() {

  const body = { user: { fullname: "Bruno favato" }, url: "www.digi3.com.br.teste" }
  try {
    const send = await Mail.use('smtp').send((message) => {
      message
        .from(process.env.SMTP_USERNAME!)
        .subject('Easytalk')
      // TO + Template
      message.to('brunofa23@gmail.com')
      message.htmlView('emails/manifest', body)
    })

    return send
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    throw new BadRequest('Erro ao enviar e-mail', 500, error)
  }
}
