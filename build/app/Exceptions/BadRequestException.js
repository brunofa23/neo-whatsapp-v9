"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
class BadRequestException extends standalone_1.Exception {
    async handle(error, ctx) {
        return ctx.response.status(error.status).send({
            code: error.code,
            message: error.message,
            status: error.status,
        });
    }
}
exports.default = BadRequestException;
//# sourceMappingURL=BadRequestException.js.map