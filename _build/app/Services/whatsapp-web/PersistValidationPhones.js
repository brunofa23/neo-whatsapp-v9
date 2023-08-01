"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const VerifyNumber_1 = require("./VerifyNumber");
exports.default = async (client) => {
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const shippingCampaignList = await Shippingcampaign_1.default.query().whereNull('phonevalid')
        .andWhere('created_at', '>=', yesterday)
        .whereNull('messagesent')
        .orWhere('messagesent', '=', 0);
    for (let dataRow of shippingCampaignList) {
        dataRow.cellphoneserialized = await (0, VerifyNumber_1.verifyNumber)(client, dataRow.cellphone);
        dataRow.messagesent = false;
        if (dataRow.cellphoneserialized) {
            dataRow.phonevalid = true;
        }
        try {
            dataRow.save();
        }
        catch (error) {
            console.log("ERRO:", error);
        }
    }
    return shippingCampaignList;
};
//# sourceMappingURL=PersistValidationPhones.js.map