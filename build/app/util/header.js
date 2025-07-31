"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeaders = void 0;
function getHeaders(options = { withAuthorization: true, withFile: false, withFormData: false }) {
    const headers = {};
    headers["Content-Type"] = "application/json";
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, PUT, DELETE, OPTIONS";
    return { headers };
}
exports.getHeaders = getHeaders;
//# sourceMappingURL=header.js.map