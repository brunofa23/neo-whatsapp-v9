import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'configs'
  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.datetime('valuedatetime')

    })
  }
  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('valuedatetime')
    })
  }
}