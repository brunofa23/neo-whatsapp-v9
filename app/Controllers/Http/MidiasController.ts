
import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'



const fs = require('fs-extra')
const path = require('path')

export default class MidiasController {

  public async index({ }: HttpContextContract) {
    console.log("Index Midias...")
  }



  public async teste(media) {
    console.log("Passei pelo teste...", media)
    try {
      const { mimetype, data } = media

      if (!mimetype.includes("audio/ogg"))
        return
      // Crie um buffer a partir do dado base64
      const buffer = Buffer.from(data, 'base64')

      // Gere um caminho para salvar o arquivo
      const fileName = `audio_${Date.now()}.ogg`
      const filePath = Application.makePath(`app/Medias/Customchats/${fileName}`)
      await fs.ensureDir(path.dirname(filePath))
      fs.writeFileSync(filePath, buffer);
      console.log("ARQUIVO SALVO COM SUCESSO")


    } catch (error) {
      console.log("ERROR")
    }



  }



}
