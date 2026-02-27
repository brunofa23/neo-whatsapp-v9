"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = require("fs");
const fs = require('fs-extra');
class MidiasController {
    async midia({ request, response, params }) {
        const fileName = params.filename;
        const filePath = Application_1.default.makePath(`Medias/Customchats/${fileName}`);
        if (!fs.existsSync(filePath)) {
            return response.notFound({ error: 'Arquivo não encontrado', fileName, filePath });
        }
        const stat = await fs.stat(filePath);
        const range = request.header('range');
        response.header('Content-Type', 'audio/ogg');
        response.header('Accept-Ranges', 'bytes');
        if (!range) {
            response.header('Content-Length', stat.size);
            return response.stream((0, fs_1.createReadStream)(filePath));
        }
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;
        response.status(206);
        response.header('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        response.header('Content-Length', chunkSize);
        return response.stream((0, fs_1.createReadStream)(filePath, { start, end }));
    }
    async midiapath({ params }) {
        const fileName = params.filename;
        return { url: `/api/midia/${fileName}` };
    }
}
exports.default = MidiasController;
//# sourceMappingURL=MidiasController.js.map