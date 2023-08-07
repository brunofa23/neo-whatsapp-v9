"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Database"));
const Interaction_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Interaction"));
const luxon_1 = require("luxon");
const util_1 = require("../../Services/whatsapp-web/util");
class DatasourcesController {
    async DataSource() {
        const interactionList = await Interaction_1.default.query().where('status', '=', 1);
        for (const interaction of interactionList) {
            if (interaction.id == 1) {
                console.log("CONFIRMAÇÃO DE AGENDAS", interaction.name);
                return await this.scheduledPatients();
            }
            else if (interaction.id == 2) {
                console.log("Teste de envio amadurecimento do chip", interaction.name);
            }
            if (interaction.id == 3) {
                console.log("AVALIAÇÃO DOS PACIENTES", interaction.name);
            }
        }
    }
    async scheduledPatients() {
        async function greeting(message) {
            const greeting = ['Olá!', 'Oi tudo bem?', 'Saudações!', 'Oi como vai?'];
            const presentation = ['Eu me chamo Iris', 'Eu sou a Iris', 'Aqui é a Iris'];
            return message.replace('{greeting}', greeting[Math.floor(Math.random() * greeting.length)]).replace('{presentation}', presentation[Math.floor(Math.random() * presentation.length)]);
        }
        const pacQueryModel = await Interaction_1.default.find(1);
        const env = process.env.NODE_ENV;
        const pacQueryDev = `SELECT
        1 AS interaction_id,
        1 AS interaction_seq,
        pac_reg AS reg,
        pac_nome AS name,
        pac_celular AS cellphone,
        pac_ind_whatsapp,
        agm_hini,
        agm_confirm_stat,
        PSV_APEL,
        SMK_ROT,
        RIGHT('0' + CAST(DAY(AGM_HINI) AS VARCHAR(2)), 2) + '/' +
        RIGHT('0' + CAST(MONTH(AGM_HINI) AS VARCHAR(2)), 2) + '/' +
        CAST(YEAR(AGM_HINI) AS VARCHAR(4)) AS data_agm,
        agm_id AS idexternal,
        'Olá tudo bem? Eu sou a Iris, atendimento virtual do *Neo, Núcleo de Excelência em Oftalmologia*. O motivo do meu contato, ' +
        CASE
            WHEN pac_sexo = 'M' THEN 'Sr. '
            WHEN pac_sexo = 'F' THEN 'Sra. '
            ELSE ''
        END +
        '*' + SUBSTRING(pac_nome, 1, CHARINDEX(' ', pac_nome) - 1) + '*' +
        ', é para confirmar seu horário conosco, agendado para o dia ' +
        '*' + CONVERT(NVARCHAR(20), agm_hini, 103) + ' ' + CONVERT(NVARCHAR(20), agm_hini, 108) + '*' +
        ' na Unidade ' + '*' + RTRIM(str_nome) + '*' +
        ' com ' + psv_trat + '*' +
        SUBSTRING(PSV_APEL, 1, CHARINDEX(' ', PSV_APEL) - 1) + '*' +
        ' podemos confirmar?\n*1* para sim \n*2* para reagendamento' AS message,
        '{"address":"' + EMP_END +', '+ emp_comp+'","medic":"'+psv_trat+' '+SUBSTRING(PSV_APEL, 1, CHARINDEX(' ', PSV_APEL) - 1)+'"}'   AS otherfields
    FROM (
        SELECT
            pac_reg, pac_nome, pac_celular, pac_ind_whatsapp, agm_hini, agm_id, agm_confirm_stat, str_nome, PSV_APEL, SMK_ROT, pac_sexo, emp_end, emp_comp, EMP_END_BAIRRO, psv_trat,
            ROW_NUMBER() OVER (PARTITION BY pac_nome ORDER BY agm_hini) AS row_num
        FROM pac
        INNER JOIN agm ON (agm_pac = PAC_REG)
        INNER JOIN psv ON (agm_med = PSV_COD)
        INNER JOIN STR ON (AGM_STR_COD = str_cod)
        INNER JOIN MED ON (AGM_MED = PSV_COD)
        INNER JOIN SMK ON (AGM_SMK = SMK_COD)
        INNER JOIN emp ON (STR_EMP_COD = emp_cod)
        WHERE
            agm_id IS NOT NULL
            AND PSV_CC <> 99999
            /*************************************/
            AND AGM_HINI BETWEEN
            CASE
                WHEN DATEPART(WEEKDAY, GETDATE()) = 2 -- Segunda-feira
                    THEN CAST(DATEADD(DAY, 1, GETDATE()) AS DATE)
                WHEN DATEPART(WEEKDAY, GETDATE()) = 3 -- Terça-feira
                    THEN CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
          WHEN DATEPART(WEEKDAY, GETDATE()) = 4 -- Quarta-feira
                    THEN CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
          WHEN DATEPART(WEEKDAY, GETDATE()) = 5 -- Quinta-feira
                    THEN CAST(DATEADD(DAY, 2, GETDATE()) AS DATE)
          WHEN DATEPART(WEEKDAY, GETDATE()) >= 6 -- Sexta-feira
                    THEN CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
            END
            AND
            CASE
                WHEN DATEPART(WEEKDAY, GETDATE()) = 2 -- Segunda-feira
                    THEN CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
                WHEN DATEPART(WEEKDAY, GETDATE()) = 3 -- Terca-feira
                    THEN CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
          WHEN DATEPART(WEEKDAY, GETDATE()) = 4 -- Quarta-feira
                    THEN CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
          WHEN DATEPART(WEEKDAY, GETDATE()) = 5 -- Quinta-feira
                    THEN CAST(DATEADD(DAY, 3, GETDATE()) AS DATE)
          WHEN DATEPART(WEEKDAY, GETDATE()) >= 6 -- Sexta-feira
                    THEN CAST(DATEADD(DAY, 4, GETDATE()) AS DATE)
            END

            /****************************************/
            AND AGM_STAT NOT IN ('C', 'B')
            AND AGM_CONFIRM_STAT NOT IN ('C')
    ) AS subquery
    WHERE row_num = 1
    AND pac_reg IN (23202, 252143, 343367, 343367, 343368)
    ORDER BY AGM_HINI;`;
        let pacQuery;
        if (env === 'development')
            pacQuery = pacQueryModel?.querydev;
        else
            pacQuery = pacQueryModel?.query;
        try {
            const result = await Database_1.default.connection('mssql').rawQuery(pacQuery);
            for (const data of result) {
                const message = await greeting(data.message);
                data.message = message;
            }
            return result;
        }
        catch (error) {
            return error;
        }
    }
    async confirmSchedule(id) {
        const date = await (0, util_1.DateFormat)("dd/MM/yyyy HH:mm:ss", luxon_1.DateTime.local());
        const query = `update agm set AGM_CONFIRM_STAT = 'C',
                   AGM_CONFIRM_OBS='NEO CONFIRMA by CONFIRMA ou CANCELA - WhatsApp em ${date}',
                   AGM_CONFIRM_USR = 'NEOCONFIRM'
                   where agm_id = ${id}`;
        try {
            const result = await Database_1.default.connection('mssql').rawQuery(query);
        }
        catch (error) {
            return error;
        }
    }
}
exports.default = DatasourcesController;
//# sourceMappingURL=DatasourcesController.js.map