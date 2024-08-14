"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Response_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Response"));
class ResponsesController {
    async index(response) {
        const query = Response_1.default.query();
        if (response.local)
            query.where('local', response.local);
        const data = await query;
        const responseList = [];
        data.map((resp) => {
            responseList.push(resp.message);
        });
        return responseList;
    }
}
exports.default = ResponsesController;
//# sourceMappingURL=ResponsesController.js.map