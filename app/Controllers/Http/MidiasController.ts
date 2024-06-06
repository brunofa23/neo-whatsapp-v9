
import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'



const fs = require('fs-extra')
const path = require('path')

export default class MidiasController {

  public async index({ }: HttpContextContract) {
    console.log("Index Midias...")
  }



  public async storeMedia(media, fileName, folder) {
    try {
      const { mimetype, data } = media
      if (!mimetype.includes("audio/ogg"))
        return
      // Crie um buffer a partir do dado base64
      const buffer = Buffer.from(data, 'base64')
      // Gere um caminho para salvar o arquivo
      const fileNameFull = `audio_${fileName}.ogg`
      const filePath = Application.makePath(`Medias/${folder}/${fileNameFull}`)
      await fs.ensureDir(path.dirname(filePath))
      fs.writeFileSync(filePath, buffer);
      console.log("ARQUIVO SALVO COM SUCESSO")
      return filePath

    } catch (error) {
      console.log("ERROR")
    }



  }



}
