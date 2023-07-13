
async function sendRepeatedMessage(client) {
  console.log("executando sendmessage...", client.user)
  const phoneNumber = '553185228619@c.us'
  const message = 'Olá, gostaria de confirmar seu agendamento? \nSim\nNão'; // Mensagem a ser enviada

  client.sendMessage(phoneNumber, message).then((response) => {
    console.log('Message sent successfully!');
    return true
  }).catch((error) => {
    console.error('Failed to send message:', error);
    return false
  });

}


module.exports = { sendRepeatedMessage }




