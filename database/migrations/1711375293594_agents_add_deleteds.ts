import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'agents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('deleted')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('deleted')
    })
  }
}
