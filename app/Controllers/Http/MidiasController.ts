
import Application from '@ioc:Adonis/Core/Application'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'



const fs = require('fs-extra')
const path = require('path')

export default class MidiasController {

  public async index({ }: HttpContextContract) {
    console.log("Index Midias...")
  }


  public async store({request, response}: HttpContextContract) {
    console.log("store Midias...")
    try {

      const { mimetype, data } = request.only(['mimetype', 'data'])
      // Crie um buffer a partir do dado base64
      const buffer = Buffer.from(data, 'base64')

    } catch (error) {

    }

  }

  public async teste(media){
    console.log("Passei pelo teste...", media)

    try {
      const { mimetype, data } = media

      if(!mimetype.includes("audio/ogg"))
        return
      // Crie um buffer a partir do dado base64
      const buffer = Buffer.from(data, 'base64')

      // Gere um caminho para salvar o arquivo
      const fileName = `audio_${Date.now()}.ogg`
      console.log("filename", fileName)

      const filePath = Application.tmpPath(`teste/${fileName}`)
      console.log("filePath",filePath)
      //path.join(Helpers.publicPath('uploads'), fileName)

      // Assegure que o diretório exista
      await fs.ensureDir(path.dirname(filePath))

      // Escreva o arquivo no sistema de arquivos
      await fs.writeFile(filePath, buffer)

      console.log("ARQUIVO SALVO COM SUCESSO")


    } catch (error) {
      console.log("ERROR")
    }



  }



}
