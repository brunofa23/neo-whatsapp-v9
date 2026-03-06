import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { createReadStream } from 'fs'
import Env from '@ioc:Adonis/Core/Env'

const fs = require('fs-extra')


export default class MidiasController {
  public async midia({ params, response }: HttpContextContract) {
    const rawFileName = params.filename as string
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
    return { url: `/midia/${encodeURIComponent(fileName)}` }
  }

  public async filetosend({ params, response }: HttpContextContract) {
    const rawFileName = params.filename as string
    const fileName = decodeURIComponent(rawFileName)

    console.log('MidiasController.filetosend rawFileName:', rawFileName)
    console.log('MidiasController.filetosend decoded fileName:', fileName)

    const filePath = Application.makePath('Medias', 'FilesToSend', fileName)
    console.log('MidiasController.filetosend filePath:', filePath)

    try {
      await fs.access(filePath)
    } catch {
      return response.status(404).send('Arquivo não encontrado')
    }

    if (fileName.endsWith('.pdf')) {
      response.header('Content-Type', 'application/pdf')
    }

    return response.stream(createReadStream(filePath))
  }

  public async filetosendpath({ params }: HttpContextContract) {
    const fileName = params.filename
    return { url: `${Env.get('APP_URL')}/filetosend/${encodeURIComponent(fileName)}` }
  }


}
