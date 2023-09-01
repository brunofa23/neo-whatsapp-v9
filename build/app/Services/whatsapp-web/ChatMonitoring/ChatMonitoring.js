"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShippingcampaignsController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/ShippingcampaignsController"));
const Chat_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Chat"));
const util_1 = require("../util");
const ConfirmSchedule_1 = __importDefault(require("./ConfirmSchedule"));
async function verifyNumberInternal(phoneVerify) {
    const list_phone_talking = process.env.LIST_PHONES_TALK;
    const list_phones = list_phone_talking?.split(",");
    for (const phone of list_phones) {
        console.log("passei no verify internals");
        if (phoneVerify === phone)
            return true;
    }
}
class Monitoring {
    async monitoring(client) {
        try {
            client.on('message', async (message) => {
                const chat = await Chat_1.default.query()
                    .preload('shippingcampaign')
                    .where('cellphoneserialized', '=', message.from)
                    .whereNull('response').first();
                if (chat && chat.returned == false) {
                    chat.invalidresponse = message.body.slice(0, 348);
                    chat.returned = true;
                    await chat.save();
                }
                if (chat) {
                    global.contSend--;
                    if (chat.interaction_id == 1) {
                        await (0, ConfirmSchedule_1.default)(client, message, chat);
                        return;
                    }
                }
                else {
                    if (message.body.toUpperCase() === 'OI' || message.body.toUpperCase() === 'OLÁ') {
                        console.log("ENTREI NO OI...");
                        await (0, util_1.stateTyping)(message);
                        client.sendMessage(message.from, "Olá, sou a Iris, atendente virtual do Neo.");
                        return;
                    }
                    else if (message.body.startsWith("verificar")) {
                        const string = message.body;
                        const numbers = string.match(/\d/g).join("");
                        await (0, util_1.stateTyping)(message);
                        console.log("Resultado do telefone:", numbers);
                        try {
                            client.getNumberId(numbers).then((result) => {
                                console.log('Number ID:', result);
                                if (result)
                                    client.sendMessage(message.from, `Número de Whatsapp validado: ${result?._serialized}`);
                                if (!result || result._serialized === undefined)
                                    client.sendMessage(message.from, `Número não identificado para o Whatsapp.`);
                            }).catch((error) => {
                                console.error('Failed to get number ID:', error);
                            });
                        }
                        catch (error) {
                            console.log("ERRO:::", error);
                        }
                        return;
                    }
                    else if (message.body.toUpperCase() === "#PD") {
                        const pd = new ShippingcampaignsController_1.default();
                        const result = await pd.dayPosition();
                        const sendResponse = `*Total diário:* ${result.totalDiario}\n*Telefones válidos:* ${result.telefonesValidos}\n*Mensagens Enviadas:* ${result.mensagensEnviadas}\n*Mensagens Retornadas:* ${result.mensagensRetornadas}\n*Confirmações:* ${result.confirmacoes}\n*Reagendamentos:* ${result.reagendamentos}`;
                        await (0, util_1.stateTyping)(message);
                        client.sendMessage(message.from, `*Posição diária até o momento:*`);
                        client.sendMessage(message.from, sendResponse);
                    }
                    else if (message.body === 'PinChat') {
                        console.log("CLIENTE", message);
                    }
                    else {
                        await (0, util_1.stateTyping)(message);
                        client.sendMessage(message.from, "Olá, sou apenas uma atendente virtual, desculpe mas esta conversa já foi encerrada. O Neo Agradece! ");
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