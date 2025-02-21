"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Logger"));
const HttpExceptionHandler_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/HttpExceptionHandler"));
class ExceptionHandler extends HttpExceptionHandler_1.default {
    constructor() {
        super(Logger_1.default);
    }
    async handle(error, ctx) {
        if (error.status === 422) {
            return ctx.response.status(error.status).send({
                code: 'BAD_REQUEST 422',
                message: error.message,
                status: error.status,
                errors: error['messages']?.errors ? error['messages'].errors : ''
            });
        }
        return super.handle(error, ctx);
    }
}
exports.default = ExceptionHandler;
//# sourceMappingURL=Handler.js.map