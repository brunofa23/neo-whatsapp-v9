import Env from '@ioc:Adonis/Core/Env'
import type { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'

const databaseConfig: DatabaseConfig = {
  connection: Env.get('DB_CONNECTION'),

  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: Env.get('MYSQL_HOST'),
        port: 3306,//Env.get('MYSQL_PORT'),
        user: Env.get('MYSQL_USER'),
        password: Env.get('MYSQL_PASSWORD', ''),
        database: Env.get('MYSQL_DB_NAME'),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: false,
      debug: false,
    },
    mssql: {
      client: 'mssql',
      connection: {
        options: {
          enableArithAbort: true,
        },
        user: Env.get('MSSQL_USER'),
        port: parseInt(Env.get('MSSQL_PORT')),
        server: Env.get('MSSQL_SERVER'),
        password: Env.get('MSSQL_PASSWORD'),
        database: Env.get('MSSQL_DB_NAME'),
      },
      healthCheck: false,
      debug: false,
    }

  }
}

export default databaseConfig
