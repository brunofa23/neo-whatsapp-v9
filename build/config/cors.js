"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const corsConfig = {
    enabled: true,
    origin: '*',
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
    headers: true,
    exposeHeaders: [
        'cache-control',
        'content-language',
        'content-type',
        'expires',
        'last-modified',
        'pragma',
    ],
    credentials: true,
    maxAge: 90,
};
exports.default = corsConfig;
//# sourceMappingURL=cors.js.map