import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'agents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('interaction_priority', 15).nullable().after('default_chat')


    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('interaction_priority')
    })
  }
}
