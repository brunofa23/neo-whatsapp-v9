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
        const filePath = `Medias/Customchats/${params.filename}`;
        console.log("Index Midias...", filePath);
        return response.download(filePath);
    }
    async midiapath({ params }) {
        const fileName = params.filename;
        const baseUrl = 'http://localhost:3334/api/midia';
        return { url: `${baseUrl}/${fileName}` };
    }
    async storeMedia(media, fileName, folder) {
        try {
            const { mimetype, data } = media;
            if (!mimetype.includes("audio/ogg"))
                return;
            const buffer = Buffer.from(data, 'base64');
            const fileNameFull = `audio_${fileName}.ogg`;
            const filePath = Application_1.default.makePath(`Medias/${folder}/${fileNameFull}`);
            await fs.ensureDir(path.dirname(filePath));
            fs.writeFileSync(filePath, buffer);
            console.log("ARQUIVO SALVO COM SUCESSO");
            return `${fileNameFull}`;
        }
        catch (error) {
            console.log("ERROR");
        }
    }
}
exports.default = MidiasController;
//# sourceMappingURL=MidiasController.js.map