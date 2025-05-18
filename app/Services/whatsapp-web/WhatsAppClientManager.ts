// App/Services/whatsapp-web/ClientManager.ts
type WhatsAppClientMap = Map<string, any>; // O "any" pode ser substituído por tipo mais específico

class WhatsAppClientManager {
  private clients: WhatsAppClientMap = new Map();

  addClient(agentId: string, client: any) {
    this.clients.set(agentId, client);
  }

  getClient(agentId: string) {
    return this.clients.get(agentId);
  }

  hasClient(agentId: string) {
    return this.clients.has(agentId);
  }

  removeClient(agentId: string) {
    this.clients.delete(agentId);
  }

  getAllClients() {
    return this.clients;
  }
}

export default new WhatsAppClientManager();
