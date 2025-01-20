"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("teste...");
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
const teste = Response_1.default.query();
console.log(teste);
//# sourceMappingURL=testePersistShippingCampaign.js.map