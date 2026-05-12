"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = require("fs");
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const fs = require('fs-extra');
class MidiasController {
    async midia({ params, response }) {
        const rawFileName = params.filename;
        const fileName = decodeURIComponent(rawFileName);
        console.log('MidiasController.midia rawFileName:', rawFileName);
        console.log('MidiasController.midia decoded fileName:', fileName);
        const filePath = Application_1.default.makePath('Medias', 'Customchats', fileName);
        console.log('MidiasController.midia filePath:', filePath);
        try {
            await fs.access(filePath);
        }
        catch {
            return response.status(404).send('Arquivo não encontrado');
        }
        if (fileName.endsWith('.ogg')) {
            response.header('Content-Type', 'audio/ogg');
        }
        return response.stream((0, fs_1.createReadStream)(filePath));
    }
    async midiapath({ params }) {
        const fileName = params.filename;
        return { url: `/midia/${encodeURIComponent(fileName)}` };
    }
    async filetosend({ params, response }) {
        const rawFileName = params.filename;
        const fileName = decodeURIComponent(rawFileName);
        console.log('MidiasController.filetosend rawFileName:', rawFileName);
        console.log('MidiasController.filetosend decoded fileName:', fileName);
        const filePath = Application_1.default.makePath('Medias', 'FilesToSend', fileName);
        console.log('MidiasController.filetosend filePath:', filePath);
        try {
            await fs.access(filePath);
        }
        catch {
            return response.status(404).send('Arquivo não encontrado');
        }
        if (fileName.endsWith('.pdf')) {
            response.header('Content-Type', 'application/pdf');
        }
        return response.stream((0, fs_1.createReadStream)(filePath));
    }
    async filetosendpath({ params }) {
        const fileName = params.filename;
        return { url: `${Env_1.default.get('APP_URL')}/filetosend/${encodeURIComponent(fileName)}` };
    }
}
exports.default = MidiasController;
//# sourceMappingURL=MidiasController.js.map