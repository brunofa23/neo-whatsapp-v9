"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DatasourcesController_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Controllers/Http/DatasourcesController"));
const Shippingcampaign_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Shippingcampaign"));
const util_1 = require("./util");
const luxon_1 = require("luxon");
const util_2 = global[Symbol.for('ioc.use')]("App/Services/whatsapp-web/util");
function isIterable(obj) {
    try {
        return obj !== null && typeof obj[Symbol.iterator] === 'function';
    }
    catch (error) {
        return false;
    }
}
function toMessageValue(v) {
    if (v === undefined || v === null)
        return null;
    if (typeof v === 'string')
        return v;
    try {
        return JSON.stringify(v);
    }
    catch {
        return String(v);
    }
}
exports.default = async (date, prioritysend = false, interaction_id = 0, unit_cod = 0) => {
    if (!date || typeof date !== 'string')
        return [];
    const asText = (v) => (v == null ? '' : String(v)).trim();
    const onlyDigits = (v) => asText(v).replace(/\D+/g, '');
    const dataSourceList = await new DatasourcesController_1.default().DataSource(date, interaction_id, unit_cod);
    const patientList = [];
    if (!isIterable(dataSourceList)) {
        console.log('Algum erro ocorrido, não é iterable', typeof dataSourceList);
        return [];
    }
    const since = luxon_1.DateTime.now()
        .setZone('America/Sao_Paulo')
        .minus({ days: 5 })
        .startOf('day')
        .toJSDate();
    for (const data of dataSourceList) {
        try {
            if (!data?.reg || !data?.interaction_id) {
                continue;
            }
            const shipping = new Shippingcampaign_1.default();
            shipping.interaction_id = data.interaction_id;
            shipping.interaction_seq = data.interaction_seq;
            shipping.reg = data.reg;
            shipping.dateshedule = data.agm_hini;
            shipping.idexternal = data.idexternal;
            shipping.name = asText(data.name);
            const phone = onlyDigits(data.cellphone);
            shipping.cellphone = phone;
            shipping.cellphoneserialized = phone ? (0, util_2.normalizePhoneKey)(phone) : null;
            const normalized = await (0, util_1.ValidatePhone)(phone);
            if (normalized) {
                shipping.phonevalid = true;
            }
            else {
                shipping.phonevalid = null;
            }
            shipping.messagesent = false;
            shipping.message = asText(data.message).replace(/@p[0-9]/g, '?');
            shipping.otherfields = data.otherfields ?? null;
            shipping.doctor = asText(data.doctor);
            shipping.unit = asText(data.unit);
            shipping.unit_cod = asText(data.unit_cod);
            shipping.attendant = asText(data.attendant);
            shipping.covenant = '';
            shipping.dateservice = data.dateservice;
            shipping.company_id = data.company_id;
            shipping.phone_unit = data.phone_unit;
            shipping.type_service = data.type_service;
            shipping.prioritysend = !!prioritysend;
            shipping.file_path = data.file_path ?? null;
            shipping.gupshupParams = data.gupshupParams ?? null;
            const verifyExist = await Shippingcampaign_1.default.query()
                .where('reg', data.reg)
                .andWhere('created_at', '>=', since)
                .andWhere('interaction_id', data.interaction_id)
                .first();
            const phoneKey = phone ? (0, util_2.normalizePhoneKey)(phone) : null;
            if (verifyExist) {
                const updatePhonePayload = {};
                if (shipping.phonevalid !== undefined && shipping.phonevalid !== verifyExist.phonevalid) {
                    updatePhonePayload.phonevalid = shipping.phonevalid;
                }
                if (phoneKey && !verifyExist.cellphoneserialized) {
                    updatePhonePayload.cellphoneserialized = phoneKey;
                }
                if (Object.keys(updatePhonePayload).length > 0) {
                    await Shippingcampaign_1.default.query()
                        .where('id', verifyExist.id)
                        .update(updatePhonePayload);
                }
            }
            if (verifyExist &&
                (verifyExist.gupshupParams == null || String(verifyExist.gupshupParams).trim() === '') &&
                shipping.gupshupParams) {
                await Shippingcampaign_1.default.query()
                    .where('id', verifyExist.id)
                    .update({
                    gupshupParams: shipping.gupshupParams,
                });
            }
            if (!verifyExist) {
                const created = await Shippingcampaign_1.default.create(shipping);
                patientList.push({ reg: created.reg, name: created.name, unit: created.unit });
            }
        }
        catch (error) {
            console.log('Erro ao criar Shippingcampaign', { reg: data?.reg, interaction_id: data?.interaction_id }, error);
        }
    }
    return patientList;
};
//# sourceMappingURL=PersistShippingcampaign.js.map