"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
console.log(">>>", process.env.SERVER_URL_API_NEO);
const envServerUrl = `${process.env.SERVER_URL_API_NEO}`;
console.log("ENV>>", envServerUrl);
axios_1.default.defaults.baseURL = envServerUrl;
axios_1.default.defaults.headers.common['Content-Type'] = 'application/json';
axios_1.default.defaults.timeout = 1200000;
exports.default = axios_1.default;
//# sourceMappingURL=axios.js.map