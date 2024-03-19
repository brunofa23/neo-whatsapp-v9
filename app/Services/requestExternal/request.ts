import axios from 'axios'

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
      token = responseSession.data.token
    }
    console.log("token....", token)
    return

    const headers = {
      'x-auth-token': '{FB64D88D-FC9E-45C1-AEA4-20E19C41549F}'
    }
    const url = "/agenda/cancelar"
    const response = await axios.post(url, body, { headers })
    return response
  } catch (error) {
    return error
  }
}

export { cancelSchedule, session }
