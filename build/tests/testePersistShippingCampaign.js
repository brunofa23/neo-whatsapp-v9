<<<<<<< HEAD
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("teste...");
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
const teste = Response_1.default.query();
console.log(teste);
=======
async function temporizadorComSegundosRandomicos() {
    const value = require('../app/Services/whatsapp-web/util');
    const time = await value.GenerateRandomTime(10000, 50000);
    return time;
}
temporizadorComSegundosRandomicos();
>>>>>>> development
//# sourceMappingURL=testePersistShippingCampaign.js.map