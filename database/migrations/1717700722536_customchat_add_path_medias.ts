import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'customchats'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('path_media')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('path_media')
    })
  }
}
