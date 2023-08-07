"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const ConfirmSchedule_1 = __importDefault(require("./ConfirmSchedule"));
class Monitoring {
    async monitoring(client) {
        try {
            client.on('message', async (message) => {
                const chat = await Chat_1.default.query()
                    .preload('shippingcampaign')
                    .where('cellphoneserialized', '=', message.from)
                    .whereNull('response').first();
                if (chat) {
                    if (chat.interaction_id == 1) {
                        global.contSend--;
                        await (0, ConfirmSchedule_1.default)(client, message, chat);
                        return;
                    }
                }
                else {
                    if (message.body.toUpperCase() === 'OI' || message.body.toUpperCase() === 'OLÁ') {
                        console.log("ENTREI NO OI...");
                        client.sendMessage(message.from, "Olá, sou a atendente virtual.");
                        return;
                    }
                    else if (message.body.startsWith("#testar")) {
                    }
                    else if (message.body.startsWith("verificar")) {
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
                    else if (message.body === "destroy") {
                        client.logout()
                            .then(() => {
                            console.log('Conversa encerrada com sucesso.');
                        })
                            .catch((error) => {
                            console.error('Erro ao encerrar a conversa:', error);
                        });
                        return;
                    }
                    else if (message.body === 'PinChat') {
                        console.log("CLIENTE", message);
                    }
                    else {
                        client.sendMessage(message.from, "Olá, esta conversa já foi encerrada. O Neo Agradece! ");
                    }
                }
            });
        }
        catch (error) {
            console.log("ERRO>>>>", error);
        }
    }
}
exports.default = Monitoring;
//# sourceMappingURL=ChatMonitoring.js.map