"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs = require('fs-extra');
const path = require('path');
class MidiasController {
    async midia({ response, params }) {
        const fileName = params.filename;
        const filePath = Application_1.default.makePath(`Medias/Customchats/${fileName}`);
        console.log('MidiasController.midia filename:', fileName);
        console.log('MidiasController.midia filePath:', filePath);
        if (!fs.existsSync(filePath)) {
            console.log('MidiasController.midia -> arquivo não encontrado');
            return response.notFound({
                error: 'Arquivo não encontrado',
                fileName,
                filePath,
            });
        }
        return response.download(filePath);
    }
    async midiapath({ params }) {
        const fileName = params.filename;
        const url = `/api/midia/${fileName}`;
        return { url };
    }
}
exports.default = MidiasController;
//# sourceMappingURL=MidiasController.js.map