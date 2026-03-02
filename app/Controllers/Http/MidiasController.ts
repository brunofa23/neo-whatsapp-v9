// app/Controllers/Http/MidiasController.ts
import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { createReadStream } from 'fs'
const fs = require('fs-extra')

export default class MidiasController {
  public async midia({ params, response }: HttpContextContract) {
    // ✅ certo: a rota é /midia/:filename
    const rawFileName = params.filename as string

    // ✅ decodifica
    const fileName = decodeURIComponent(rawFileName)

    console.log('MidiasController.midia rawFileName:', rawFileName)
    console.log('MidiasController.midia decoded fileName:', fileName)

    const filePath = Application.makePath('Medias', 'Customchats', fileName)
    console.log('MidiasController.midia filePath:', filePath)

    try {
      await fs.access(filePath)
    } catch {
      return response.status(404).send('Arquivo não encontrado')
    }

    if (fileName.endsWith('.ogg')) {
      response.header('Content-Type', 'audio/ogg')
    }

    return response.stream(createReadStream(filePath))
  }

  public async midiapath({ params }: HttpContextContract) {
    const fileName = params.filename
    // ✅ devolve URL da rota real (sem /api, a menos que exista prefixo)
    return { url: `/midia/${encodeURIComponent(fileName)}` }
  }
}
