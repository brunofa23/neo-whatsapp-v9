"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function verifyNumberInternal(phoneVerify) {
    const list_phone_talking = process.env.LIST_PHONES_TALK;
    const list_phones = list_phone_talking?.split(",");
    for (const phone of list_phones) {
        if (phoneVerify === phone)
            return true;
    }
}
class Monitoring {
    async monitoring(client) {
        try {
            console.log("CHAT PASSO 1");
            client.on('message', async (message) => {
                console.log("CHAT PASSO 2", message.body);
                if (message.body === '1') {
                    console.log("getContacts");
                    const getContact = await client.getContacts();
                    console.log(getContact);
                }
                if (message.body === '2') {
                    console.log("getState");
                    const get = await client.getState();
                    console.log(get);
                }
                if (message.body === '3') {
                    console.log("Set display Name");
                    const get = await client.setDisplayName('Neo Bruno Favato');
                    console.log(get);
                }
                if (message.body === '4') {
                    console.log("logout");
                    const get = await client.logout();
                    console.log(get);
                }
                if (message.body === '5') {
                    console.log("getlabels");
                    const get = await client.getLabels();
                    console.log(get);
                }
                if (message.body === '6') {
                    const numberId = await client.getNumberId('3187096643');
                    console.log("number id>>>", numberId);
                    await client.setDisplayName('Neo Bruno Favato');
                    await client.sendMessage(numberId?._serialized, "teste de mensagem")
                        .then(async (response) => {
                        console.log(response);
                    }).catch(async (error) => {
                        console.log("ERRO 1452:::", error);
                    });
                }
                if (message.body === '8') {
                    console.log("chat delete");
                    const get = await message.delete();
                    console.log(get);
                }
            });
        }
        catch (error) {
            console.log("ERRO>>>>", error);
        }
    }
}
exports.default = Monitoring;
//# sourceMappingURL=ChatMonitoringAgentChat.js.map