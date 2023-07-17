/**
 * Config source: https://git.io/JesV9
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import Env from '@ioc:Adonis/Core/Env'

import type { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'

const databaseConfig: DatabaseConfig = {

  connection: Env.get('DB_CONNECTION'),

  connections: {

    mssql: {
      client: 'mssql',
      connection: {
        user: Env.get('MSSQL_USER'),
        port: parseInt(Env.get('MSSQL_PORT')),
        server: Env.get('MSSQL_SERVER'),
        password: Env.get('MSSQL_PASSWORD', ''),
        database: Env.get('MSSQL_DB_NAME'),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: false,
      debug: false,
    },
    mssql2: {//chatbot
      client: 'mssql',
      connection: {
        user: Env.get('MSSQL_USER'),
        port: parseInt(Env.get('MSSQL_PORT')),
        server: Env.get('MSSQL_SERVER'),
        password: Env.get('MSSQL_PASSWORD', ''),
        database: Env.get('MSSQL_DB_NAME2'),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: false,
      debug: false,
    }



  }
}

export default databaseConfig
