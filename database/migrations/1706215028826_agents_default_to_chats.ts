import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'agents'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('default_chat').defaultTo('false')
    })
  }


  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reverter as alterações feitas no método "up"
      table.dropColumn('default_chat')
    })
  }




}
