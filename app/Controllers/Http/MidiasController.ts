// app/Controllers/Http/MidiasController.ts
import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { createReadStream } from 'fs'

const fs = require('fs-extra')

export default class MidiasController {
  public async midia({ request, response, params }: HttpContextContract) {
    const fileName = params.filename
    const filePath = Application.makePath(`Medias/Customchats/${fileName}`)

    if (!fs.existsSync(filePath)) {
      return response.notFound({ error: 'Arquivo não encontrado', fileName, filePath })
    }

    const stat = await fs.stat(filePath)
    const range = request.header('range')

    response.header('Content-Type', 'audio/ogg')
    response.header('Accept-Ranges', 'bytes')

    if (!range) {
      response.header('Content-Length', stat.size)
      return response.stream(createReadStream(filePath))
    }

    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
    const chunkSize = end - start + 1

    response.status(206)
    response.header('Content-Range', `bytes ${start}-${end}/${stat.size}`)
    response.header('Content-Length', chunkSize)

    return response.stream(createReadStream(filePath, { start, end }))
  }

  public async midiapath({ params }: HttpContextContract) {
    const fileName = params.filename
    // ⚠️ IMPORTANTE: caminho RELATIVO, sem /app1
    return { url: `/api/midia/${fileName}` }
  }
}
