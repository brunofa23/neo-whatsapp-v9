"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DatasourcesController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/DatasourcesController"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const util_1 = require("../whatsapp-web/util");
const moment = require("moment");
function isIterable(obj) {
    try {
        return obj !== null && typeof obj[Symbol.iterator] === 'function';
    }
    catch (error) {
        return false;
    }
}
exports.default = async () => {
    const dataSource = new DatasourcesController_1.default;
    const dataSourceList = await dataSource.DataSource();
    if (!isIterable(dataSourceList)) {
        console.log("Algum erro ocorrido, não é iterable", dataSourceList);
        return;
    }
    for (const data of dataSourceList) {
        try {
            const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
            const shipping = new Shippingcampaign_1.default();
            shipping.interaction_id = data.interaction_id;
            shipping.interaction_seq = data.interaction_seq;
            shipping.reg = data.reg;
            shipping.idexternal = data.idexternal;
            shipping.name = String(data.name).trim();
            shipping.cellphone = data.cellphone;
            if (!await (0, util_1.ValidatePhone)(data.cellphone))
                shipping.phonevalid = false;
            shipping.messagesent = false;
            shipping.message = String(data.message).replace(/@p[0-9]/g, '?');
            shipping.otherfields = data.otherfields;
            const verifyExist = await Shippingcampaign_1.default.query()
                .where('reg', '=', data.reg)
                .andWhere('created_at', '>=', yesterday)
                .andWhere('interaction_id', '=', data.interaction_id)
                .first();
            if (!verifyExist) {
                await Shippingcampaign_1.default.create(shipping);
            }
        }
        catch (error) {
            console.log("Erro 44454>>>>", error);
        }
    }
};
//# sourceMappingURL=PersistShippingcampaign.js.map