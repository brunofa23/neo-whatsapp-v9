"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const runner_1 = require("@japa/runner");
const Config_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Config"));
(0, runner_1.test)('display welcome page', async ({ client }) => {
    const configId = 'scheduledPatients';
    const verifySchedulePatientsInConfigsDB = await Config_1.default.find(configId);
    if (!verifySchedulePatientsInConfigsDB) {
        console.log("Não está cadastrado. Criando registro...");
        await Config_1.default.updateOrCreate({ id: configId }, {
            id: configId,
            name: 'Verifica se está rodando a função SchedulePatients',
            valuebool: true
        });
    }
    else if (verifySchedulePatientsInConfigsDB.valuebool == false) {
        console.log("Existe, mas está falso. Atualizando para true...");
        verifySchedulePatientsInConfigsDB.valuebool = true;
        await verifySchedulePatientsInConfigsDB.save();
    }
    else {
        console.log("Existe e está true. Nada a fazer.");
    }
});
//# sourceMappingURL=hello_world.spec.js.map