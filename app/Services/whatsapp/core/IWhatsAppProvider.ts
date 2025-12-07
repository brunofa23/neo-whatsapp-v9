/**
 * Tipo de provedor de WhatsApp que estamos usando.
 *
 * - 'wwebjs'  => usa a biblioteca whatsapp-web.js com sessão local e Puppeteer.
 * - 'megaapi' => usa a MegaAPI via requisições HTTP + webhooks.
 *
 * Isso ajuda a saber, em qualquer ponto do sistema, quem foi o "dono"
 * daquela mensagem (para logs, debug, etc.).
 */
export type ProviderKind = 'wwebjs' | 'megaapi'

/**
 * Representa UMA mensagem recebida pelo sistema (inbound),
 * já "normalizada", independente se veio do wwebjs ou da MegaAPI.
 *
 * Ou seja: tudo que chega do WhatsApp no seu sistema (texto do paciente,
 * resposta em grupo, etc.) vira um WaInboundMessage.
 */
export type WaInboundMessage = {
  /**
   * Provedor que originou a mensagem (wwebjs ou megaapi).
   * Útil pra logar, debugar e tomar decisões específicas se precisar.
   */
  provider: ProviderKind

  /**
   * ID do agente (sua tabela agents.id) que está associado a essa sessão/instância.
   * É como você liga a mensagem recebida a um "número de WhatsApp" específico
   * configurado na sua aplicação.
   */
  agentId: number

  /**
   * Quem enviou a mensagem.
   * Normalmente será um JID do WhatsApp, por exemplo "5531999998888@c.us".
   * Essa é a origem do paciente/contato.
   */
  from: string

  /**
   * Para quem a mensagem foi enviada.
   * Normalmente, o número do próprio agente ou sessão,
   * ex: "553188887777@c.us" (número do seu bot/atendente).
   */
  to: string

  /**
   * Texto da mensagem (corpo).
   * Se for mídia sem legenda, pode vir vazio.
   */
  body: string

  /**
   * Indica se a mensagem possui alguma mídia (áudio, imagem, documento, etc.).
   * Mesmo que o corpo (body) tenha texto, esse flag diz se há mídia junto.
   */
  hasMedia: boolean

  /**
   * ID único da mensagem no contexto do provedor.
   * - No wwebjs, geralmente é o id da Message.
   * - Na MegaAPI, pode ser o id retornado pelo webhook.
   *
   * Esse campo é importante para:
   *  - deduplicar mensagens (evitar processar duas vezes),
   *  - cruzar com ACKs,
   *  - salvar em log/Talk/Chat se precisar.
   */
  messageId: string

  /**
   * Momento em que a mensagem foi enviada (timestamp em milissegundos).
   * Ajuda para ordenar, métricas, logs e eventuais timeouts.
   */
  timestamp: number

  /**
   * Payload bruto vindo do provedor (opcional).
   * Útil quando você precisa ter acesso a campos específicos
   * que não estão mapeados na estrutura acima.
   *
   * Ex: { original: ..., extraFields: ... }
   */
  raw?: any
}

/**
 * Representa um ACK (confirmação de entrega/leitura) de uma mensagem.
 *
 * Em wwebjs o "ack" é um número (0, 1, 2, 3, 4).
 * Em MegaAPI (ou outros), você pode mapear status equivalentes.
 */
export type WaAck = {
  /**
   * Quem está informando o ACK (wwebjs ou megaapi).
   */
  provider: ProviderKind

  /**
   * ID do agente (agents.id) relacionado à mensagem cujo ACK está sendo recebido.
   */
  agentId: number

  /**
   * Número/jid de destino da mensagem (quem recebeu a mensagem).
   */
  to: string

  /**
   * Número/jid de origem da mensagem (quem enviou).
   * No caso de mensagens enviadas pelo seu bot, normalmente é o número do agente.
   */
  from: string

  /**
   * ID da mensagem que está sendo confirmada.
   * Deve ser o mesmo messageId usado quando a mensagem foi enviada ou recebida.
   */
  messageId: string

  /**
   * Código de ACK:
   *   0 => mensagem criada/local
   *   1 => enviada ao servidor
   *   2 => entregue ao destinatário
   *   3 => lida
   *   4 => reproduzida (no caso de áudio)
   *
   * (Isso segue o padrão do whatsapp-web.js; outros providers podem mapear
   * seus próprios códigos para algo equivalente.)
   */
  ack: number

  /**
   * Momento em que o ACK foi gerado (timestamp em milissegundos).
   */
  timestamp: number
}

/**
 * Interface genérica para qualquer "provedor" de WhatsApp.
 *
 * A IDEIA É:
 * - Seu código de negócio (SendMessage, ChatMonitoring, IA, etc.)
 *   NUNCA mais depender diretamente do `Client` do whatsapp-web.js ou da MegaAPI.
 *
 * - Em vez disso, ele depende APENAS dessa interface.
 *
 * Assim:
 *   - WWebJS vira um "adapter" que IMPLEMENTA essa interface.
 *   - MegaAPI vira outro "adapter" que IMPLEMENTA essa interface.
 *
 * O restante da aplicação NÃO precisa saber qual deles está por baixo.
 */
export interface IWhatsAppProvider {
  /**
   * Identifica qual é o tipo desse provider (wwebjs ou megaapi).
   * Isso pode ser útil para logs e decisões específicas.
   */
  kind: ProviderKind

  /**
   * Inicia (ou garante que está iniciada) a sessão do agente informado.
   *
   * Exemplos:
   *  - WWebJS: inicializa o Client, faz login ou usa sessão local.
   *  - MegaAPI: pode checar se a instância está "online" via HTTP.
   */
  start(agentId: number): Promise<void>

  /**
   * Para/desconecta a sessão do agente.
   *
   * Exemplos:
   *  - WWebJS: client.destroy() ou logout().
   *  - MegaAPI: pode não fazer nada (dependendo de como a API funciona),
   *             ou apenas ajustar algum flag interno.
   */
  stop(agentId: number): Promise<void>

  /**
   * Retorna o estado atual da sessão (texto simples).
   *
   * Exemplos:
   *  - "CONNECTED"
   *  - "DISCONNECTED"
   *  - "AUTHENTICATING"
   *  - etc.
   *
   * Para WWebJS: geralmente vem de client.getState().
   * Para MegaAPI: pode vim de um endpoint de status da instância.
   */
  getState(agentId: number): Promise<string>

  /**
   * Envia uma mensagem de TEXTO para um número/jid específico.
   *
   * - agentId: qual agente (número configurado) está enviando.
   * - to: JID ou número normalizado do destinatário (ex: "5531999998888@c.us").
   * - text: corpo da mensagem.
   *
   * Retorna um objeto com o ID da mensagem criada no provedor.
   */
  sendText(agentId: number, to: string, text: string): Promise<{ messageId: string }>

  /**
   * Envia uma mensagem com MÍDIA (arquivo) para um número/jid.
   *
   * - filePath: caminho do arquivo no sistema de arquivos (server),
   *             que deverá ser lido/enviado pelo provider.
   * - caption: legenda opcional junto com o arquivo.
   */
  sendMedia(
    agentId: number,
    to: string,
    filePath: string,
    caption?: string
  ): Promise<{ messageId: string }>

  /**
   * Registra um callback para tratar mensagens RECEBIDAS (inbound).
   *
   * Esse callback é chamado SEMPRE que o provedor detectar uma nova
   * mensagem do WhatsApp:
   *
   *  - No WWebJS: dentro do client.on('message', ...)
   *  - Na MegaAPI: ao receber um webhook de mensagem nova e convertê-la
   *                para WaInboundMessage.
   */
  onMessage(cb: (msg: WaInboundMessage) => Promise<void>): void

  /**
   * Registra um callback para tratar ACKs de mensagens ENVIADAS.
   *
   * Esse callback é chamado quando o provedor informar que a mensagem
   * enviada teve seu status atualizado (entregue, lida, etc.):
   *
   *  - No WWebJS: client.on('message_ack', ...)
   *  - Na MegaAPI: via webhook de status de mensagem (se existir).
   */
  onAck(cb: (ack: WaAck) => Promise<void>): void

  /**
   * Registra um callback para tratar eventos de DESCONEXÃO do agente.
   *
   * Esse callback deve ser chamado sempre que o provedor detectar que a
   * sessão daquele agente caiu.
   *
   *  - No WWebJS: client.on('disconnected', ...)
   *  - Na MegaAPI: talvez via endpoint de status ou webhook.
   *
   * Isso é importante para:
   *  - atualizar tabela de Agents (statusconnected, status)
   *  - parar loops de envio
   *  - enviar notificações de alerta, etc.
   */
  onDisconnected(cb: (agentId: number, reason: string) => Promise<void>): void
}
