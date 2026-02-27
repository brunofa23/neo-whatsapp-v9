// app/Controllers/Http/MidiasController.ts
import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { createReadStream } from 'fs'

const fs = require('fs-extra')

export default class MidiasController {
  public async midia({ response, params }: HttpContextContract) {
    const fileName = params.filename

    // Arquivo salvo em: <root>/Medias/Customchats/<fileName>
    const filePath = Application.makePath(`Medias/Customchats/${fileName}`)

    console.log('MidiasController.midia fileName:', fileName)
    console.log('MidiasController.midia filePath:', filePath)

    if (!fs.existsSync(filePath)) {
      console.log('MidiasController.midia -> arquivo não encontrado')
      return response.notFound({
        error: 'Arquivo não encontrado',
        fileName,
        filePath,
      })
    }

    // Header correto pro áudio
    response.header('Content-Type', 'audio/ogg')
    response.header('Accept-Ranges', 'bytes')

    return response.stream(createReadStream(filePath))
  }

  public async midiapath({ params }: HttpContextContract) {
    const fileName = params.filename
    // ⚠️ IMPORTANTE: caminho RELATIVO, sem /app1
    return { url: `/api/midia/${fileName}` }
  }
}
