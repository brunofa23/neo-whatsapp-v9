"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WhatsAppClientManager {
    constructor() {
        this.clients = new Map();
    }
    addClient(agentId, client) {
        this.clients.set(agentId, client);
    }
    getClient(agentId) {
        return this.clients.get(agentId);
    }
    hasClient(agentId) {
        return this.clients.has(agentId);
    }
    removeClient(agentId) {
        this.clients.delete(agentId);
    }
    getAllClients() {
        return this.clients;
    }
}
exports.default = new WhatsAppClientManager();
//# sourceMappingURL=WhatsAppClientManager.js.map