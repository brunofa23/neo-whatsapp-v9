import { test } from '@japa/runner'
import Response from 'App/Models/Response'
import ResponsesController from 'App/Controllers/Http/ResponsesController'
import Log from 'App/Models/Log'
import Agent from 'App/Models/Agent'

test('display welcome page', async ({ client }) => {
console.log("executando teste.....bRUNO")

const list_agents =await Agent.query()
   .select('number_phone')
   .whereNull('deleted')
   .andWhere('status','CONNECTED')

  let retorno
  for (const element of list_agents) {
      if(element.number_phone=='553190753880')
        retorno= true
  }

  console.log(retorno)


  //await Log.create({name:'ValidatePhone', message:'erro 12211: número não validado',description:"Verificar na função ValidatePhone" })
  // const cellphone = '31991927066'
  // const regexTelefoneCelular = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
  // const retorno = regexTelefoneCelular.test(cellphone);
  // console.log("RESULTADO", retorno)


  // const teste = new ResponsesController()
  // const list = await teste.index({local:'presentation'})
  // console.log(">>>>>>>>>>>>>>>>>>>", list)
//   const teste = await Response.query()
//   .where('local','presentation')

// const teste2=[]
//   const respostas = teste.map((resp)=>{
//     teste2.push(resp.message)
//   })
})
