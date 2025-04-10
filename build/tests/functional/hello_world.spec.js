"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs = require('fs');
(0, runner_1.test)('display welcome page', async ({ client }) => {
    console.log('*******TESTES');
    try {
        const filePath = Application_1.default.makePath(`app/Services/Ai/model.nlp`);
        const teste = fs.existsSync(filePath);
        console.log("::::::path:", filePath);
        console.log("::::::", teste);
    }
    catch (error) {
        console.log("ERRO:", error);
    }
});
//# sourceMappingURL=hello_world.spec.js.map