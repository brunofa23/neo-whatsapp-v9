// app/Services/whatsapp-gupshup-monitoring/GupshupSender.ts
import SendMessageGupshup from 'App/Services/whatsapp-gupshup/SendMessageGupshup'

export default class GupshupSender {
  public async sendText(to: string, text: string) {
    // ajuste aqui pro seu formato real do SendMessageGupshup
    // exemplo:
    await SendMessageGupshup.sendText(to, text)
  }
}
