"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.session = exports.cancelSchedule = void 0;
const axios_1 = __importDefault(require("axios"));
async function session() {
    try {
        const user = {
            login: process.env.SERVER_API_USER,
            senha: process.env.SERVER_API_PASSWORD
        };
        const url = "/sessao";
        const response = await axios_1.default.post(url, user, {});
        return response;
    }
    catch (error) {
        return error;
    }
}
exports.session = session;
async function cancelSchedule(body) {
    try {
        let token;
        const responseSession = await session();
        if (responseSession.status == 200) {
            token = responseSession.data.Token;
        }
        const headers = {
            'x-auth-token': token
        };
        const url = "/agenda/cancelar";
        const response = await axios_1.default.post(url, body, { headers });
        return response;
    }
    catch (error) {
        return error;
    }
}
exports.cancelSchedule = cancelSchedule;
//# sourceMappingURL=request.js.map