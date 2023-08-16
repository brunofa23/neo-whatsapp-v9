"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const databaseConfig = {
    connection: Env_1.default.get('DB_CONNECTION'),
    connections: {
        mssql: {
            client: 'mssql',
            connection: {
                user: Env_1.default.get('MSSQL_USER'),
                port: parseInt(Env_1.default.get('MSSQL_PORT')),
                server: Env_1.default.get('MSSQL_SERVER'),
                password: Env_1.default.get('MSSQL_PASSWORD', ''),
                database: Env_1.default.get('MSSQL_DB_NAME'),
                requestTimeout: 30000,
            },
            migrations: {
                naturalSort: true,
            },
            healthCheck: false,
            debug: false,
        },
        mssql2: {
            client: 'mssql',
            connection: {
                user: Env_1.default.get('MSSQL_USER'),
                port: parseInt(Env_1.default.get('MSSQL_PORT')),
                server: Env_1.default.get('MSSQL_SERVER'),
                password: Env_1.default.get('MSSQL_PASSWORD', ''),
                database: Env_1.default.get('MSSQL_DB_NAME2'),
                requestTimeout: 30000,
            },
            migrations: {
                naturalSort: true,
            },
            healthCheck: false,
            debug: false,
        }
    }
};
exports.default = databaseConfig;
//# sourceMappingURL=database.js.map