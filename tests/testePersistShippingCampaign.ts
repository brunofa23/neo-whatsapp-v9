//import { GenerateRandomTime } from '../app/Services/whatsapp-web/util'




async function temporizadorComSegundosRandomicos() {
  const value = require('../app/Services/whatsapp-web/util')
  const time = await value.GenerateRandomTime(10000, 50000)
  return time

}

// Chamando a função temporizadora
temporizadorComSegundosRandomicos();
