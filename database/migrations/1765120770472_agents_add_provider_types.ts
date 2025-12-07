// database/migrations/xxxx_add_provider_type_to_agents.ts
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'agents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .string('provider_type', 20)
        .notNullable()
        .defaultTo('wwebjs').after('active') // 'wwebjs' | 'megaapi'
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('provider_type')
    })
  }
}
