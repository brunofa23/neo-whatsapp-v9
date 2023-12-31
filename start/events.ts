import Agent from "App/Models/Agent"
import { startAgent } from "../app/Services/whatsapp-web/whatsappConnection"
async function connectionAll() {
  try {
    console.log("connection all acionado...")
    const agents = await Agent.query()
    //console.log("agents", agents)
    for (const agent of agents) {
      console.log("Conectando agente:", agent.id)
      await startAgent(agent)
    }
    // return response.status(201).send('ConnectedAll')
  } catch (error) {
    error
  }
}

module.exports = { connectionAll }
