// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Response from "App/Models/Response"

export default class ResponsesController {

  public async index(response: Object) {
    const query = Response.query()
    if(response.local)
      query.where('local', response.local)
    const data = await query
    const responseList = []
    data.map((resp) => {
      responseList.push(resp.message)
    })
    return responseList[Math.floor(Math.random() * responseList.length)]

  }

}
