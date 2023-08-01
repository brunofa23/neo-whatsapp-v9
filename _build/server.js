"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
const source_map_support_1 = __importDefault(require("source-map-support"));
require("reflect-metadata");
source_map_support_1.default.install({ handleUncaughtExceptions: false });
new standalone_1.Ignitor(__dirname)
    .httpServer()
    .start();
//# sourceMappingURL=server.js.map