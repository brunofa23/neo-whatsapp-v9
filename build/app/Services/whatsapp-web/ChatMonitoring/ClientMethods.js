"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Methods {
    async executeMethod(client, method) {
        try {
            client.on('message', async (message) => {
                if (message.body.startsWith("verificar")) {
                    const string = message.body;
                    const numbers = string.match(/\d/g).join("");
                    console.log("Resultado do telefone:", numbers);
                    try {
                        client.getNumberId(numbers).then((result) => {
                            console.log('Number ID:', result);
                            client.sendMessage(message.from, "teste");
                        }).catch((error) => {
                            console.error('Failed to get number ID:', error);
                        });
                    }
                    catch (error) {
                        console.log("ERRO:::", error);
                    }
                    return;
                }
                else if (method === "logout") {
                    console.log("Entrei no logout....");
                    client.logout()
                        .then(() => {
                        console.log('Conversa encerrada com sucesso.');
                    })
                        .catch((error) => {
                        console.error('Erro ao encerrar a conversa:', error);
                    });
                    return;
                }
            });
        }
        catch (error) {
            console.log("ERRO>>>>", error);
        }
    }
}
exports.default = Methods;
//# sourceMappingURL=ClientMethods.js.map