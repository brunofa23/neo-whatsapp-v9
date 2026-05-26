"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmOrCancelScheduleApi = exports.getSchedulesApi = exports.agendaResponse = exports.session = exports.cancelSchedule = void 0;
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
async function agendaResponse(body) {
    let token;
    const responseSession = await session();
    if (responseSession?.status == 200) {
        token =
            responseSession.data?.Token ||
                responseSession.data?.token ||
                responseSession.data?.['x-auth-token'] ||
                responseSession.headers?.['x-auth-token'];
    }
    const headers = {
        'x-auth-token': token,
        'Content-Type': 'application/json',
    };
    const url = "/Agenda";
    const response = await axios_1.default.post(url, body, { headers });
    return response;
}
exports.agendaResponse = agendaResponse;
async function getSchedulesApi(date) {
    try {
        console.log("API KLINGO!!");
        const server_header_key = process.env.SERVER_HEADER_KEY;
        const server_token = process.env.SERVER_TOKEN;
        const headers = {
            [server_header_key]: server_token
        };
        const response = await axios_1.default.get(`${process.env.SERVER_URL_API_KLINGO}/telefonia/lista/${date}`, { headers });
        return response.data;
    }
    catch (error) {
    }
}
exports.getSchedulesApi = getSchedulesApi;
async function confirmOrCancelScheduleApi(id_marcacao, status, obs) {
    try {
        const server_header_key = process.env.SERVER_HEADER_KEY;
        const server_token = process.env.SERVER_TOKEN;
        const headers = {
            [server_header_key]: server_token
        };
        const response = await axios_1.default.post(`${process.env.SERVER_URL_API_KLINGO}/telefonia/confirmar`, { id_marcacao, status, obs }, { headers });
        if (response.status === 200 && response.data == 'OK') {
            return true;
        }
        return response.data;
    }
    catch (error) {
        console.log("error:", error);
        return error;
    }
}
exports.confirmOrCancelScheduleApi = confirmOrCancelScheduleApi;
//# sourceMappingURL=request.js.map