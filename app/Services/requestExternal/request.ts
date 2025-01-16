import axios from 'axios'

//PARA O SISTEMA SMART
async function session() {
  try {

    const user = {
      login: process.env.SERVER_API_USER,
      senha: process.env.SERVER_API_PASSWORD
    }

    const url = "/sessao"
    const response = await axios.post(url, user, {})
    return response
  } catch (error) {
    return error
  }

}

async function cancelSchedule(body) {
  try {
    let token
    const responseSession = await session()
    if (responseSession.status == 200) {
      token = responseSession.data.Token
    }
    const headers = {
      'x-auth-token': token
    }
    const url = "/agenda/cancelar"
    const response = await axios.post(url, body, { headers })
    return response
  } catch (error) {
    return error
  }
}


//BUSCA PACIENTES AGENDADOS NO KLINGO
async function getSchedulesApi(date:string){
  try {
    console.log("API KLINGO!!")
    const server_header_key:string|undefined = process.env.SERVER_HEADER_KEY
    const server_token = process.env.SERVER_TOKEN
    const headers = {
      [server_header_key]: server_token
    }
    const response = await axios.get(`${process.env.SERVER_URL_API_KLINGO}/telefonia/lista/${date}`,{headers})
    const responseFilter = response.data.filter(item => item.status_confirmacao === "A Confirmar");
    return responseFilter
  } catch (error) {

  }
}

//CONFIRMA OU CANCELA AGENDAMENTO
async function confirmOrCancelScheduleApi(id_marcacao:number, status:string, obs:string){
  try {
    console.log("API KLINGO CONFIRMA OU CANCELA!!")
    const server_header_key:string|undefined = process.env.SERVER_HEADER_KEY
    const server_token = process.env.SERVER_TOKEN
    const headers = {
      [server_header_key]: server_token
    }
    const response = await axios.post(`${process.env.SERVER_URL_API_KLINGO}/telefonia/confirmar`,{id_marcacao, status,obs },{headers})
    console.log("RESPONSE:", response.data)
    if(response.status===200 && response.data=='OK'){
      return true
    }
    return response.data
  } catch (error) {

    console.log("error:",error)
    return error
  }
}

export { cancelSchedule, session, getSchedulesApi, confirmOrCancelScheduleApi }
