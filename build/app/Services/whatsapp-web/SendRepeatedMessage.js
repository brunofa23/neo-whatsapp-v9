"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRepeatedMessage = void 0;
const PersistShippingcampaign_1 = __importDefault(require("./PersistShippingcampaign"));
const util_1 = require("./util");
async function sendRepeatedMessage(agent) {
    setInterval(async () => {
        const targetDates = (0, util_1.getTargetDates)();
        if (await (0, util_1.TimeSchedule)()) {
            for (const date of targetDates) {
                const formatted = date.toFormat('yyyy-MM-dd');
                console.log(`Buscando dados no Smart(Server): ${formatted}`);
                await (0, PersistShippingcampaign_1.default)(formatted);
            }
        }
    }, await (0, util_1.GenerateRandomTime)(300, 400, '****Send Message Repeated'));
}
exports.sendRepeatedMessage = sendRepeatedMessage;
//# sourceMappingURL=SendRepeatedMessage.js.map