import { Client, Message } from 'whatsapp-web.js';

async function stateTyping(message: Message) {
  console.log("passei pelo STATETYPING...")
  const chatTyping = await message.getChat();
  chatTyping.sendStateTyping();
  return await new Promise(resolve => setTimeout(resolve, 3000));
}



module.exports = { stateTyping }
