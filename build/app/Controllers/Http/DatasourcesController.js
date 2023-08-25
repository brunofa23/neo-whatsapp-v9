"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Interaction_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Interaction"));
const luxon_1 = require("luxon");
const util_1 = require("../../Services/whatsapp-web/util");
class DatasourcesController {
    async DataSource() {
        const interactionList = await Interaction_1.default.query().where('status', '=', 1);
        for (const interaction of interactionList) {
            if (interaction.id == 1) {
                await Database_1.default.manager.close('mssql');
                return await this.scheduledPatients();
            }
            else if (interaction.id == 2) {
                console.log("Teste de envio amadurecimento do chip", interaction.name);
            }
            if (interaction.id == 3) {
                console.log("AVALIAÇÃO DOS PACIENTES", interaction.name);
            }
        }
    }
    async scheduledPatients() {
        async function greeting(message) {
            const greeting = ['Olá!', 'Oi tudo bem?', 'Saudações!', 'Oi como vai?'];
            const presentation = ['Eu me chamo Iris', 'Eu sou a Iris', 'Aqui é a Iris'];
            return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{presentation}', presentation[Math.floor(Math.random() * presentation.length)]);
        }
        const pacQueryModel = await Interaction_1.default.find(1);
        const env = process.env.NODE_ENV;
        let pacQuery;
        if (env === 'development')
            pacQuery = pacQueryModel?.querydev;
        else
            pacQuery = pacQueryModel?.query;
        try {
            const result = await Database_1.default.connection('mssql').rawQuery(pacQuery);
            for (const data of result) {
                const message = await greeting(data.message);
                data.message = message;
            }
            await Database_1.default.manager.close('mssql');
            return result;
        }
        catch (error) {
            return { "ERRO": "ERRO 154212", error };
        }
    }
    async confirmSchedule(id) {
        const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        const query = `update agm set AGM_CONFIRM_STAT = 'C',
                   AGM_CONFIRM_OBS='NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${date}',
                   AGM_CONFIRM_USR = 'NEOCONFIRM'
                   where agm_id = ${id}`;
        try {
            const result = await Database_1.default.connection('mssql').rawQuery(query);
            await Database_1.default.manager.close('mssql');
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = DatasourcesController;
//# sourceMappingURL=DatasourcesController.js.map