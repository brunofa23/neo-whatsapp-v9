import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddMegaapiFieldsToAgents extends BaseSchema {
  protected tableName = 'agents'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      /**
       * Configurações específicas da MegaAPI para este agente.
       * Podem ser nulas para agentes que usam wwebjs.
       */

      // Host da MegaAPI (ex.: "apistart01.megaapi.com.br")
      table
        .string('megaapi_host', 100)
        .nullable()
        .comment('Host da MegaAPI para este agente')
        .after('provider_type')

      // Instance key da MegaAPI (ex.: "megastart-XXXX...")
      table
        .string('megaapi_instance_key', 150)
        .nullable()
        .comment('Instance key da MegaAPI para este agente')
        .after('megaapi_host')

      // Token de autenticação (Bearer) da MegaAPI
      table
        .string('megaapi_token', 255)
        .nullable()
        .comment('Token de autenticação da MegaAPI para este agente')
        .after('megaapi_instance_key')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('megaapi_host')
      table.dropColumn('megaapi_instance_key')
      table.dropColumn('megaapi_token')
    })
  }
}
