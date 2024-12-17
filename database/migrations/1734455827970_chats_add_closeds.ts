import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'chats'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('closed').defaultTo(false).after('company_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('closed')
    })
  }


}
