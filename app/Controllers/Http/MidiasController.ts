// app/Controllers/Http/MidiasController.ts
import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

const fs = require('fs-extra')
const path = require('path')

export default class MidiasController {
  public async midia({ response, params }: HttpContextContract) {
    const fileName = params.filename

    // Vai procurar em: <root-do-projeto>/Medias/Customchats/arquivo.ogg
    const filePath = Application.makePath(`Medias/Customchats/${fileName}`)

    console.log('MidiasController.midia filename:', fileName)
    console.log('MidiasController.midia filePath:', filePath)

    if (!fs.existsSync(filePath)) {
      console.log('MidiasController.midia -> arquivo não encontrado')
      return response.notFound({
        error: 'Arquivo não encontrado',
        fileName,
        filePath,
      })
    }

    return response.download(filePath)
  }

  public async midiapath({ params }: HttpContextContract) {
    const fileName = params.filename
    const url = `/api/midia/${fileName}`
    return { url }
  }
}
