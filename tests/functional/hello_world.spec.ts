import { test } from '@japa/runner'
import Response from 'App/Models/Response'
import ResponsesController from 'App/Controllers/Http/ResponsesController'

test('display welcome page', async ({ client }) => {
  const teste = new ResponsesController()
  const list = await teste.index({local:'presentation'})
  console.log(">>>>>>>>>>>>>>>>>>>", list)
//   const teste = await Response.query()
//   .where('local','presentation')

// const teste2=[]
//   const respostas = teste.map((resp)=>{
//     teste2.push(resp.message)
//   })
})
