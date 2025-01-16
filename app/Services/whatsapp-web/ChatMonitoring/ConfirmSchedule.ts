import { NegativeResponse, PositiveResponse, stateTyping } from '../util'
import Chat from 'App/Models/Chat';
import Response from 'App/Models/Response';
import { Client, Message } from 'whatsapp-web.js';

export default async (client: Client, message: Message, chat: Chat) => {

  //PERGUNTA 1 - GOSTARIA DE AGENDAR A CONSULTA
  if (message.hasMedia) {
    await stateTyping(message)
    client.sendMessage(message.from, 'Por favor não envie áudio, imagens ou vídeos, apenas digite \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.')
    return
  }
  if (chat.interaction_seq == 1) {
    const chatOtherFields = JSON.parse(chat.shippingcampaign.otherfields)
    if (await PositiveResponse(message.body)) {//presença confirmada
      await stateTyping(message)//status de digitando...
      // try {
      //   //BUSCA MENSAGEM DA TABELA RESPONSE SE NÃO TIVER USA DA NEO
      //   const response1schedule = await Response.query().select('message').where('local', 'response1shcedule').first()
      //   let response1message
      //   if (response1schedule) {//Substitui os campos pelo da tabela responses
      //     const personalizedMessage = response1schedule.message
      //       .replace('${chatOtherFields.address}', chatOtherFields.address)
      //       .replace('${chatOtherFields.medic}', chatOtherFields.medic)
      //       .replace('${chatOtherFields.phone_unit}', chatOtherFields.phone_unit);
      //     response1message = personalizedMessage
      //   } else response1message = `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chatOtherFields.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chat.shippingcampaign.phone_unit}.`

      //   client.sendMessage(message.from, response1message)
      //   chat.response = message.body.slice(0, 500)
      //   chat.returned = true
      //   chat.absoluteresp = 1
      //   chat.externalstatus = 'A'
      //   chat.company_id = chat.shippingcampaign.company_id

      //   await chat.save()
      // } catch (error) {
      //   console.log("Erro 454:", error)
      // }
      try {
        // Função para substituir os placeholders na mensagem
        const formatMessage = (template, fields) => {
          return template
            .replace('${chatOtherFields.address}', fields.address || 'Endereço indisponível')
            .replace('${chatOtherFields.medic}', fields.medic || 'Médico não informado')
            .replace('${chatOtherFields.phone_unit}', fields.phone_unit || 'Contato indisponível');
        };

        // Busca a mensagem personalizada ou usa a mensagem padrão
        const response1schedule = await Response.query()
          .select('message')
          .where('local', 'response1shcedule')
          .first();

        const defaultMessage = `Muito obrigada 😀, seu agendamento foi confirmado, o endereço da sua consulta é ${chat.shippingcampaign.address}. Esperamos por você. Ótimo dia. Lembrando que para qualquer dúvida, estamos disponíveis pelo whatsapp ${chat.shippingcampaign.phone_unit}.`;

        const response1message = response1schedule
          ? formatMessage(response1schedule.message, chatOtherFields)
          : defaultMessage;

        // Envia a mensagem ao cliente
        await client.sendMessage(message.from, response1message);

        // Atualiza o chat com os dados de resposta
        Object.assign(chat, {
          response: message.body.slice(0, 500),
          returned: true,
          absoluteresp: 1,
          externalstatus: 'A',
          company_id: chat.shippingcampaign.company_id,
        });
        await chat.save();
      } catch (error) {
        console.error("Erro ao enviar a mensagem de agendamento:", error.message, error.stack);
      }
      //Salvar no Smart e marcar presença
    } else
      //CANCELAR AGENDAMENTO
      if (await NegativeResponse(message.body)) {
        chat.response = message.body
        chat.absoluteresp = 2
        chat.externalstatus = 'A'
        chat.company_id = chat.shippingcampaign.company_id

        try {
          await chat.save()
        } catch (error) {
          console.log("Erro 121:", error)
        }
        //CANCELA MARCAÇÃO NO SMART NEO
        await stateTyping(message)
        const message2 = `Entendi 😉, sabemos que nosso dia está muito atarefado! Sua consulta foi desmarcada, se deseja reagendar, clique no link que estou enviando para conversar com uma de nossas atendentes e podermos agendar novo horário mais conveniente para você.`
        client.sendMessage(message.from, message2)
        const messageLink = `Olá, sou ${chat.name} e gostaria de reagendar uma consulta com ${chatOtherFields.medic}.`
        const encodedMessage = encodeURIComponent(messageLink);
        const linkRedirect = `https://api.whatsapp.com/send?phone=${chat.shippingcampaign.phone_unit}&text=${encodedMessage}`;
        client.sendMessage(message.from, linkRedirect)

        const chat2 = new Chat()
        Object.assign(chat2, {
          interaction_id: chat.interaction_id,
          interaction_seq: 2,
          idexternal: chat.idexternal,
          reg: chat.reg,
          name: chat.name,
          cellphone: chat.cellphone,
          cellphoneserialized: message.from,
          shippingcampaigns_id: chat.shippingcampaigns_id,
          message: message2.slice(0, 348),
          response: "Reagendada",
          returned: true,
          company_id: chat.shippingcampaign.company_id
        });

        try {
          Chat.create(chat2)
        } catch (error) {
          console.log("Erro:", error)
        }

      } else {
        await stateTyping(message)
        client.sendMessage(message.from, 'Oi, desculpe mas não consegui identificar uma resposta, por favor responda \n*1* para Confirmar o agendamento. \n*2* para Reagendamento ou Cancelamento.')
      }

  }

}


