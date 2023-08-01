"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const whatsapp_ts_1 = require("../../Services/whatsapp-web/whatsapp.ts");
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
class ShippingcampaignsController {
    static get connection() {
        return 'mssql2';
    }
    async index({ response, request }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default.all();
            return response.status(200).send(shippingCampaign);
        }
        catch (error) {
            return error;
        }
    }
    async store({ response, request }) {
        try {
            const shippingCampaign = await Shippingcampaign_1.default
                .query();
            return response.status(200).send(shippingCampaign);
        }
        catch (error) {
            return error;
        }
    }
    async resetWhatsapp() {
        console.log("EXECUTANDO RESET ZAP");
        await (0, whatsapp_ts_1.executeWhatsapp)();
    }
    async logout() {
        console.log("EXECUTANDO LOGOUT...");
        await (0, whatsapp_ts_1.executeWhatsapp)(true);
    }
    async chat({ response, request }) {
        const id = 567508;
        const query = `update agm set AGM_CONFIRM_STAT = 'C' where agm_id = ${id}`;
        try {
            console.log("EXECUTANDO UPDATE NO SMART...", query);
            await Database_1.default.connection('mssql').rawQuery(query).then((result) => {
                return `executado com sucesso:: ${result}`;
            }).catch((error) => {
                return `Error: ${error}`;
            });
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = ShippingcampaignsController;
//# sourceMappingURL=ShippingcampaignsController.js.map